<?php
/**
 * SERVER EDGE — the thin server-side component a client hosts.
 *
 * This is the ONLY server code that ships. It holds no business logic, no database, no AI,
 * and no keys. It validates and forwards; the licensed API does the work.
 *
 * It composes the edge modules contributed by each team member:
 *   licence.php        (business area)      — tenant licence configured & explained
 *   session.php        (core/API area)      — bearer passthrough + rate limiting
 *   routes.php         (portals area)       — allow-list of forwardable paths
 *   edge_cache.php     (data/AI area)       — short-lived cache for repeat reads
 *   observability.php  (architecture area)  — SLI logging (availability, latency, errors)
 *
 * Configure by copying config.example.php → config.php (git-ignored).
 */
declare(strict_types=1);

$CFG = file_exists(__DIR__ . '/config.php')
    ? require __DIR__ . '/config.php'
    : require __DIR__ . '/config.example.php';

$M = __DIR__ . '/../modules';
require_once $M . '/hafsa_business_engine/backend/licence.php';
require_once $M . '/sanchit_core_overview/backend/session.php';
require_once $M . '/arnold_portals/backend/routes.php';
require_once $M . '/sunny_data_pipeline/backend/edge_cache.php';
require_once $M . '/felicity_architecture/backend/observability.php';

$t0 = obs_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Resolve the upstream path in either deployment shape:
//   production — the web server rewrites /api/... onto this script
//   local dev  — PHP's built-in server exposes the remainder as PATH_INFO
$path = (string)($_SERVER['PATH_INFO'] ?? '');
if ($path === '') {
    $uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $path = preg_match('#/api(/.*)$#', $uri, $m) ? $m[1] : $uri;
}
$path = '/' . ltrim($path, '/');
$qs     = $_SERVER['QUERY_STRING'] ?? '';
$body   = file_get_contents('php://input') ?: '';
$token  = edge_bearer_token();

// 1) licence configured?   2) within rate limit?   3) is this path forwardable?
licence_guard($CFG);
edge_enforce_rate_limit((int)($CFG['RATE_LIMIT_PER_MIN'] ?? 60));
edge_route_guard($method, $path);

// 4) short-lived cache for repeat reads (per user, GET only)
$ck = edge_cache_key($method, $path . '?' . $qs, $body, $token);
if (($hit = edge_cache_get($ck)) !== null) {
    obs_record($method, $path, 200, $t0);
    header('X-Edge-Cache: HIT');
    echo $hit;
    exit;
}

// 5) forward upstream with the tenant licence key attached
$url     = rtrim((string)$CFG['API_BASE'], '/') . '/api' . $path . ($qs ? '?' . $qs : '');
$headers = ['Content-Type: application/json'];
if ($token !== '')               $headers[] = 'Authorization: Bearer ' . $token;
if (!empty($CFG['TENANT_KEY']))  $headers[] = 'X-Tenant-Key: ' . $CFG['TENANT_KEY'];

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_TIMEOUT        => 120,
]);
if ($method !== 'GET' && $body !== '') curl_setopt($ch, CURLOPT_POSTFIELDS, $body);

$res  = curl_exec($ch);
$code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($res === false) {
    obs_record($method, $path, 502, $t0);
    http_response_code(502);
    echo json_encode(['detail' => 'The service is unavailable. Check connectivity and your licence.']);
    exit;
}

// 6) turn upstream licence failures into something an administrator can act on
if ($explain = licence_explain($code)) {
    obs_record($method, $path, $code, $t0);
    http_response_code($code);
    echo json_encode(['detail' => $explain]);
    exit;
}

edge_cache_put($ck, (string)$res, $code);
obs_record($method, $path, $code, $t0);
header('X-Edge-Cache: MISS');
http_response_code($code ?: 200);
echo $res;

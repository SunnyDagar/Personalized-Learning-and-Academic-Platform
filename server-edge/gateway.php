<?php
/**
 * SERVER EDGE — the thin server-side component a client hosts.
 *
 * This is the ONLY server code that ships. It holds no business logic, no database,
 * no AI, and no keys. It simply forwards a request to the licensed API and returns
 * the response, so the UI never talks to the upstream service directly.
 *
 * The parts that actually make the product work — authentication, course and material
 * handling, retrieval/grounding, generation, assessments, analytics — all live on the
 * provider's server behind this call. Deleting or replacing that server makes this
 * edge (and the UI) inert.
 *
 * Configure by copying config.example.php → config.php (git-ignored) and filling in
 * the API base and the tenant key issued to you.
 */
declare(strict_types=1);

$CFG = file_exists(__DIR__ . '/config.php')
    ? require __DIR__ . '/config.php'
    : require __DIR__ . '/config.example.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Authorization, Content-Type');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') { http_response_code(204); exit; }

// The path the UI asked for, e.g. /api/chat  →  forwarded upstream unchanged.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = '/' . ltrim(preg_replace('#^.*?/api#', '', $path), '/');
$qs   = $_SERVER['QUERY_STRING'] ?? '';
$url  = rtrim((string)$CFG['API_BASE'], '/') . '/api' . $path . ($qs ? '?' . $qs : '');

$body    = file_get_contents('php://input');
$method  = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$headers = ['Content-Type: application/json'];

// Pass the end-user's session token through; add the tenant licence key.
if (!empty($_SERVER['HTTP_AUTHORIZATION'])) $headers[] = 'Authorization: ' . $_SERVER['HTTP_AUTHORIZATION'];
if (!empty($CFG['TENANT_KEY']))             $headers[] = 'X-Tenant-Key: ' . $CFG['TENANT_KEY'];

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
    http_response_code(502);
    echo json_encode(['detail' => 'The service is unavailable. Check your licence and connectivity.']);
    exit;
}
http_response_code($code ?: 200);
echo $res;

<?php
/**
 * Edge session handling & rate limiting — core/API area (slides 1–5).
 *
 * Runs on the customer's edge, before anything is forwarded upstream. It does NOT authenticate
 * (the licensed API is the only authority on identity) — it extracts the bearer token so it can
 * be passed through, and it throttles abusive clients so a single browser cannot hammer the API.
 */
declare(strict_types=1);

/** Pull the bearer token out of the request, whatever the server exposes it as. */
function edge_bearer_token(): string {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/Bearer\s+(\S+)/i', $h, $m) ? $m[1] : '';
}

/** Cheap per-IP fixed-window limiter backed by a temp file. Returns false when over limit. */
function edge_rate_ok(int $maxPerMinute = 60): bool {
    $ip     = $_SERVER['REMOTE_ADDR'] ?? 'cli';
    $window = (int)floor(time() / 60);
    $file   = sys_get_temp_dir() . '/edge_rl_' . md5($ip) . '.json';

    $state = ['w' => $window, 'n' => 0];
    if (is_readable($file)) {
        $prev = json_decode((string)file_get_contents($file), true);
        if (is_array($prev) && ($prev['w'] ?? -1) === $window) $state = $prev;
    }
    $state['n']++;
    @file_put_contents($file, json_encode($state), LOCK_EX);
    return $state['n'] <= $maxPerMinute;
}

/** Convenience: enforce the limit and emit a 429 if exceeded. */
function edge_enforce_rate_limit(int $maxPerMinute = 60): void {
    if ($maxPerMinute <= 0) return;   // 0 disables throttling entirely
    if (!edge_rate_ok($maxPerMinute)) {
        http_response_code(429);
        header('Retry-After: 60');
        echo json_encode(['detail' => 'Too many requests. Please slow down.']);
        exit;
    }
}

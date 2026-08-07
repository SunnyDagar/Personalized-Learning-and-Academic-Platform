<?php
/**
 * Rate limiting — core foundations (slides 1–5).
 *
 * An abuse throttle, not an access control. It exists so one runaway script cannot exhaust an
 * institution's AI allowance in an afternoon, and it never blocks an address outright — every
 * client is always able to use the software, just not without limit.
 *
 * A fixed window is used deliberately over a sliding log: it needs one counter rather than a list
 * of timestamps per client, which matters when this runs on a customer's modest server.
 * Self-contained and runnable:  php rate_limit.php
 */
declare(strict_types=1);

const RATE_WINDOW_SECONDS = 60;

function rate_limit_path(string $client, int $window): string {
    $safe = substr(hash('sha256', $client), 0, 16);
    return sys_get_temp_dir() . "/rl_{$safe}_{$window}.txt";
}

/** Identify the caller without storing anything identifying. */
function rate_limit_client(): string {
    $token = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    $ip    = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    return hash('sha256', $token !== '' ? $token : $ip);
}

/**
 * Consume one unit of the allowance.
 * A limit of 0 disables throttling entirely, which is what RATE_LIMIT_PER_MIN => 0 means.
 */
function rate_limit_check(string $client, int $perMinute): array {
    if ($perMinute <= 0) {
        return ['allowed' => true, 'limit' => 0, 'remaining' => null, 'reset_in' => 0];
    }

    $window = (int)floor(time() / RATE_WINDOW_SECONDS);
    $path   = rate_limit_path($client, $window);
    $count  = is_readable($path) ? (int)file_get_contents($path) : 0;
    $count++;
    @file_put_contents($path, (string)$count, LOCK_EX);

    $resetIn = ($window + 1) * RATE_WINDOW_SECONDS - time();

    return [
        'allowed'   => $count <= $perMinute,
        'limit'     => $perMinute,
        'remaining' => max(0, $perMinute - $count),
        'reset_in'  => $resetIn,
    ];
}

/** Standard headers so a well-behaved client can back off on its own. */
function rate_limit_headers(array $state): array {
    if ($state['limit'] === 0) return [];
    return [
        'X-RateLimit-Limit: ' . $state['limit'],
        'X-RateLimit-Remaining: ' . $state['remaining'],
        'X-RateLimit-Reset: ' . $state['reset_in'],
    ];
}

/** The 429 body, telling the user exactly how long to wait. */
function rate_limit_response(array $state): array {
    return [
        'detail' => "Too many requests. Please wait {$state['reset_in']} seconds and try again.",
        'status' => 429,
    ];
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $client = 'demo-' . bin2hex(random_bytes(4));
    for ($i = 1; $i <= 7; $i++) {
        $s = rate_limit_check($client, 5);
        printf("request %d → %s (remaining %s)%s", $i,
               $s['allowed'] ? 'allowed' : 'THROTTLED', $s['remaining'], PHP_EOL);
    }
    echo PHP_EOL, 'with limit disabled: ',
         var_export(rate_limit_check($client, 0)['allowed'], true), PHP_EOL;
}

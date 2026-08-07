<?php
/**
 * Health probes — architecture (slides 13–16).
 *
 * Liveness and readiness answer different questions and must not be conflated: an orchestrator
 * that restarts on a failed readiness check will restart a perfectly healthy edge every time the
 * upstream has a blip. Liveness means "this process is fine"; readiness means "it can serve
 * traffic right now".
 * Self-contained and runnable:  php health_probe.php
 */
declare(strict_types=1);

/** Is this process itself healthy? Never depends on anything remote. */
function probe_liveness(): array {
    return [
        'status'  => 'alive',
        'php'     => PHP_VERSION,
        'checked' => gmdate('c'),
    ];
}

/** Can we actually serve? Checks only what the edge itself needs. */
function probe_readiness(array $config = []): array {
    $checks = [
        'config_loaded' => !empty($config),
        'licence_set'   => !empty($config['TENANT_KEY']) && $config['TENANT_KEY'] !== 'CHANGE_ME',
        'upstream_set'  => !empty($config['API_BASE']) && filter_var($config['API_BASE'], FILTER_VALIDATE_URL) !== false,
        'temp_writable' => is_writable(sys_get_temp_dir()),
    ];
    $failed = array_keys(array_filter($checks, static fn(bool $ok): bool => !$ok));

    return [
        'status' => $failed ? 'not_ready' : 'ready',
        'checks' => $checks,
        'failed' => $failed,
    ];
}

/** HTTP status a probe endpoint should return, so an orchestrator can act on it. */
function probe_status_code(array $readiness): int {
    return ($readiness['status'] ?? '') === 'ready' ? 200 : 503;
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    print_r(probe_liveness());

    echo PHP_EOL, '-- unconfigured --', PHP_EOL;
    $bad = probe_readiness(['API_BASE' => 'https://example.com', 'TENANT_KEY' => 'CHANGE_ME']);
    echo 'status ', probe_status_code($bad), ' · failed: ', implode(', ', $bad['failed']), PHP_EOL;

    echo PHP_EOL, '-- configured --', PHP_EOL;
    $ok = probe_readiness(['API_BASE' => 'https://dagarretail.com', 'TENANT_KEY' => 'ck_example']);
    echo 'status ', probe_status_code($ok), ' · ', $ok['status'], PHP_EOL;
}

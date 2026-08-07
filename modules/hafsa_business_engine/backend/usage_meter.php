<?php
/**
 * Usage metering — business engine (slides 17–end).
 *
 * AI answers cost money per call, so usage is what connects the product to its margin. Counting at
 * the edge gives an institution a live view of its own consumption without a round trip, and gives
 * us the numbers behind the unit economics in unit_economics.py.
 *
 * The billing record of truth is upstream — these counters are for display and for warning a user
 * before they hit a limit, not for enforcement.
 * Self-contained and runnable:  php usage_meter.php
 */
declare(strict_types=1);

function usage_path(string $period): string {
    return sys_get_temp_dir() . '/usage_' . preg_replace('/[^0-9a-z_-]/i', '', $period) . '.json';
}

/** Current billing period, month-based. */
function current_period(): string {
    return gmdate('Y-m');
}

/** Record one billable event. */
function usage_record(string $metric, int $amount = 1, ?string $period = null): void {
    $period = $period ?? current_period();
    $path   = usage_path($period);
    $data   = is_readable($path) ? (json_decode((string)file_get_contents($path), true) ?: []) : [];
    $data[$metric] = ($data[$metric] ?? 0) + $amount;
    @file_put_contents($path, json_encode($data), LOCK_EX);
}

function usage_for(?string $period = null): array {
    $path = usage_path($period ?? current_period());
    return is_readable($path) ? (json_decode((string)file_get_contents($path), true) ?: []) : [];
}

/**
 * Usage against an allowance, with a warning band before the limit.
 * Warning early matters: a department that discovers its cap at 100% has already been cut off.
 */
function usage_status(string $metric, int $allowance, ?string $period = null): array {
    $used = (int)(usage_for($period)[$metric] ?? 0);
    $pct  = $allowance > 0 ? round($used / $allowance * 100, 1) : 0.0;

    return [
        'metric'    => $metric,
        'used'      => $used,
        'allowance' => $allowance,
        'remaining' => max(0, $allowance - $used),
        'pct'       => $pct,
        'state'     => $pct >= 100 ? 'exceeded' : ($pct >= 80 ? 'warning' : 'ok'),
    ];
}

function usage_reset(?string $period = null): void {
    @unlink(usage_path($period ?? current_period()));
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $p = 'demo-period';
    usage_reset($p);
    for ($i = 0; $i < 8400; $i++) usage_record('ai_answers', 1, $p);
    print_r(usage_status('ai_answers', 10000, $p));
    usage_reset($p);
}

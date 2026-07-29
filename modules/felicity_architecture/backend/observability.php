<?php
/**
 * Edge observability — architecture area (slides 13–16).
 *
 * Produces the Service Level Indicators defined in observability.md: request count, error rate,
 * and latency percentiles, measured at the edge where the customer actually experiences them.
 * Writes newline-delimited JSON so it can be tailed, shipped, or aggregated without a dependency.
 */
declare(strict_types=1);

function obs_log_path(): string { return sys_get_temp_dir() . '/edge_requests.ndjson'; }

function obs_start(): float { return microtime(true); }

function obs_record(string $method, string $path, int $status, float $startedAt): void {
    $entry = [
        'ts'     => date('c'),
        'method' => $method,
        'path'   => $path,
        'status' => $status,
        'ms'     => (int)round((microtime(true) - $startedAt) * 1000),
        'ok'     => $status >= 200 && $status < 400,
    ];
    @file_put_contents(obs_log_path(), json_encode($entry) . "\n", FILE_APPEND | LOCK_EX);
}

/** Roll the log up into the SLIs: availability, p50/p95 latency, error rate. */
function obs_report(int $lastN = 500): array {
    $file = obs_log_path();
    if (!is_readable($file)) return ['requests' => 0];
    $lines = array_slice(file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [], -$lastN);

    $lat = []; $ok = 0; $n = 0;
    foreach ($lines as $l) {
        $e = json_decode($l, true);
        if (!is_array($e)) continue;
        $n++; $lat[] = (int)($e['ms'] ?? 0); if (!empty($e['ok'])) $ok++;
    }
    if (!$n) return ['requests' => 0];
    sort($lat);
    $pct = fn(float $p) => $lat[max(0, (int)floor($p * ($n - 1)))];
    return [
        'requests'      => $n,
        'availability'  => round($ok / $n, 4),
        'error_rate'    => round(1 - $ok / $n, 4),
        'p50_ms'        => $pct(0.50),
        'p95_ms'        => $pct(0.95),
        'slo_availability_met' => ($ok / $n) >= 0.995,
        'slo_latency_met'      => $pct(0.95) <= 6000,
    ];
}

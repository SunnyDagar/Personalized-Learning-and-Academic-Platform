<?php
/**
 * Metrics buffer — architecture (slides 13–16).
 *
 * Percentiles are what matter: an average hides the slow tail that users actually notice. This
 * keeps a bounded ring of recent durations at the edge so p50/p95/p99 can be computed without
 * shipping every request off to a metrics service, and without growing without limit.
 * Self-contained and runnable:  php metrics_buffer.php
 */
declare(strict_types=1);

const METRICS_CAPACITY = 500;   // recent samples retained per metric

function metrics_path(string $metric): string {
    return sys_get_temp_dir() . '/metrics_' . preg_replace('/[^a-z0-9_]/i', '_', $metric) . '.json';
}

/** Record one observation, discarding the oldest once the ring is full. */
function metrics_record(string $metric, float $value): void {
    $path    = metrics_path($metric);
    $samples = is_readable($path) ? (json_decode((string)file_get_contents($path), true) ?: []) : [];
    $samples[] = round($value, 3);
    if (count($samples) > METRICS_CAPACITY) {
        $samples = array_slice($samples, -METRICS_CAPACITY);
    }
    @file_put_contents($path, json_encode($samples), LOCK_EX);
}

/** Nearest-rank percentile. Returns null when there is nothing to report. */
function percentile(array $samples, float $p): ?float {
    if (!$samples) return null;
    sort($samples);
    $rank = (int)ceil($p / 100 * count($samples));
    return (float)$samples[max(0, min(count($samples) - 1, $rank - 1))];
}

/** Summary of one metric — the shape the dashboard renders. */
function metrics_summary(string $metric): array {
    $path    = metrics_path($metric);
    $samples = is_readable($path) ? (json_decode((string)file_get_contents($path), true) ?: []) : [];

    if (!$samples) {
        return ['metric' => $metric, 'count' => 0, 'p50' => null, 'p95' => null, 'p99' => null];
    }
    return [
        'metric' => $metric,
        'count'  => count($samples),
        'min'    => min($samples),
        'max'    => max($samples),
        'mean'   => round(array_sum($samples) / count($samples), 1),
        'p50'    => percentile($samples, 50),
        'p95'    => percentile($samples, 95),
        'p99'    => percentile($samples, 99),
    ];
}

function metrics_reset(string $metric): void {
    @unlink(metrics_path($metric));
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    metrics_reset('demo_latency_ms');
    // Mostly fast, with a slow tail — the shape real traffic has.
    foreach (range(1, 200) as $i) {
        metrics_record('demo_latency_ms', $i % 25 === 0 ? random_int(1800, 3000) : random_int(120, 400));
    }
    print_r(metrics_summary('demo_latency_ms'));
    echo "note how p95 exposes the tail the mean hides", PHP_EOL;
    metrics_reset('demo_latency_ms');
}

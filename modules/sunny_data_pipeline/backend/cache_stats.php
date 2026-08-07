<?php
/**
 * Cache effectiveness — data & retrieval (slides 6–9).
 *
 * A cache nobody measures is a guess. Every retrieval-backed answer costs an embedding call plus a
 * generation call, so the hit rate converts directly into money saved and latency avoided — which
 * is the number worth quoting in the business case rather than "we added caching".
 * Self-contained and runnable:  php cache_stats.php
 */
declare(strict_types=1);

/** Assumed unit costs, used only to express the hit rate in terms people care about. */
const COST_PER_ANSWER_CAD = 0.0021;   // embedding + generation, measured on gemini-2.5-flash
const MS_PER_ANSWER       = 2400;     // typical round trip when not cached

function cache_stats_path(): string {
    return sys_get_temp_dir() . '/edge_cache_stats.json';
}

function cache_stats_record(bool $hit): void {
    $path  = cache_stats_path();
    $stats = is_readable($path) ? (json_decode((string)file_get_contents($path), true) ?: []) : [];
    $key   = $hit ? 'hits' : 'misses';
    $stats[$key] = ($stats[$key] ?? 0) + 1;
    @file_put_contents($path, json_encode($stats), LOCK_EX);
}

/** Hit rate plus what it is worth. */
function cache_stats(): array {
    $path  = cache_stats_path();
    $stats = is_readable($path) ? (json_decode((string)file_get_contents($path), true) ?: []) : [];
    $hits   = (int)($stats['hits'] ?? 0);
    $misses = (int)($stats['misses'] ?? 0);
    $total  = $hits + $misses;

    return [
        'hits'          => $hits,
        'misses'        => $misses,
        'total'         => $total,
        'hit_rate_pct'  => $total ? round($hits / $total * 100, 1) : 0.0,
        'cost_avoided'  => round($hits * COST_PER_ANSWER_CAD, 2),
        'seconds_saved' => round($hits * MS_PER_ANSWER / 1000, 1),
    ];
}

/** Sentence for the admin dashboard. */
function cache_summary_line(): string {
    $s = cache_stats();
    if ($s['total'] === 0) return 'No cache activity recorded yet.';
    return sprintf(
        '%s%% of %s answers served from cache — about CAD $%s and %s seconds of waiting avoided.',
        $s['hit_rate_pct'], number_format($s['total']), number_format($s['cost_avoided'], 2),
        number_format($s['seconds_saved'], 1)
    );
}

function cache_stats_reset(): void {
    @unlink(cache_stats_path());
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    cache_stats_reset();
    // A plausible day: repeat questions cluster, so roughly a third are repeats.
    for ($i = 0; $i < 900; $i++) cache_stats_record($i % 3 === 0);
    print_r(cache_stats());
    echo PHP_EOL, cache_summary_line(), PHP_EOL;
    cache_stats_reset();
}

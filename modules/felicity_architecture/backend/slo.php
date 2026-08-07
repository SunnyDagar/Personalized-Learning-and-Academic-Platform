<?php
/**
 * Service level objectives — architecture (slides 13–16).
 *
 * An SLO that is only prose cannot be checked. These are the targets we commit to an institution,
 * expressed so a number either meets them or does not. The error budget is the useful part: it
 * converts "we missed 0.3%" into "you have spent 30% of the month's allowance", which is what
 * decides whether to ship or stabilise.
 * Self-contained and runnable:  php slo.php
 */
declare(strict_types=1);

/** Each objective: the target, the measurement window, and what counts as a failure. */
function slo_definitions(): array {
    return [
        'availability' => [
            'target'  => 99.5,
            'unit'    => '%',
            'window'  => '30 days',
            'counts_as_error' => 'any 5xx, or no response within 30s',
        ],
        'latency_p95' => [
            'target'  => 1500,
            'unit'    => 'ms',
            'window'  => '30 days',
            'counts_as_error' => 'a request slower than the target',
        ],
        'ai_answer_p95' => [
            'target'  => 6000,
            'unit'    => 'ms',
            'window'  => '30 days',
            'counts_as_error' => 'retrieval plus generation slower than the target',
        ],
    ];
}

/** Pass or fail one objective against a measurement. Lower is better for latency. */
function slo_status(string $name, float $measured): array {
    $slo = slo_definitions()[$name] ?? null;
    if (!$slo) return ['name' => $name, 'known' => false];

    $pass = $slo['unit'] === '%' ? $measured >= $slo['target'] : $measured <= $slo['target'];
    return [
        'name'     => $name,
        'known'    => true,
        'target'   => $slo['target'],
        'measured' => $measured,
        'unit'     => $slo['unit'],
        'pass'     => $pass,
        'window'   => $slo['window'],
    ];
}

/**
 * Error budget for an availability objective.
 * 99.5% over 30 days allows ~3h 39m of failure; this reports how much is left.
 */
function error_budget(float $targetPct, float $measuredPct, int $windowDays = 30): array {
    $allowedFraction = (100 - $targetPct) / 100;
    $usedFraction    = max(0.0, (100 - $measuredPct) / 100);
    $allowedMinutes  = $allowedFraction * $windowDays * 24 * 60;
    $usedMinutes     = $usedFraction * $windowDays * 24 * 60;

    return [
        'allowed_minutes'   => round($allowedMinutes, 1),
        'used_minutes'      => round($usedMinutes, 1),
        'remaining_minutes' => round(max(0, $allowedMinutes - $usedMinutes), 1),
        'consumed_pct'      => $allowedMinutes > 0 ? round($usedMinutes / $allowedMinutes * 100, 1) : 0.0,
        'exhausted'         => $usedMinutes >= $allowedMinutes,
    ];
}

/** Every objective judged at once. */
function slo_report(array $measurements): array {
    $out = [];
    foreach ($measurements as $name => $value) {
        $out[$name] = slo_status($name, (float)$value);
    }
    return $out;
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    foreach (slo_report(['availability' => 99.62, 'latency_p95' => 940, 'ai_answer_p95' => 7200]) as $r) {
        printf("%-14s %8s / %-8s %s%s", $r['name'], $r['measured'] . $r['unit'],
               $r['target'] . $r['unit'], $r['pass'] ? 'PASS' : 'MISS', PHP_EOL);
    }
    echo PHP_EOL;
    print_r(error_budget(99.5, 99.62));
}

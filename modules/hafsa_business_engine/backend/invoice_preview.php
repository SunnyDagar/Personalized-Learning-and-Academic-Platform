<?php
/**
 * Invoice preview — business engine (slides 17–end).
 *
 * What an institution owes this period, shown before it is billed. Overage is the part worth
 * getting right: a customer who discovers extra charges on an invoice they never saw coming does
 * not renew, which costs far more than the overage earned.
 *
 * This is a preview, not the billing record of truth — the hosted service issues the actual
 * invoice. Presenting it at the edge means an administrator can see the position at any time.
 * Self-contained and runnable:  php invoice_preview.php
 */
declare(strict_types=1);

const HST_RATE            = 0.13;    // Ontario
const OVERAGE_PER_ANSWER  = 0.004;   // CAD, charged only beyond the plan allowance

/** Line items for the period, before tax. */
function invoice_lines(string $planLabel, float $planPrice, int $answersUsed, ?int $allowance): array {
    $lines = [[
        'description' => $planLabel . ' plan — annual licence',
        'quantity'    => 1,
        'unit'        => $planPrice,
        'amount'      => round($planPrice, 2),
    ]];

    if ($allowance !== null && $answersUsed > $allowance) {
        $over = $answersUsed - $allowance;
        $lines[] = [
            'description' => sprintf('AI answers beyond allowance (%s of %s included)',
                                     number_format($answersUsed), number_format($allowance)),
            'quantity'    => $over,
            'unit'        => OVERAGE_PER_ANSWER,
            'amount'      => round($over * OVERAGE_PER_ANSWER, 2),
        ];
    }
    return $lines;
}

/** Totals with tax. */
function invoice_totals(array $lines): array {
    $subtotal = round(array_sum(array_column($lines, 'amount')), 2);
    $tax      = round($subtotal * HST_RATE, 2);
    return [
        'subtotal' => $subtotal,
        'tax'      => $tax,
        'tax_rate' => HST_RATE,
        'total'    => round($subtotal + $tax, 2),
        'currency' => 'CAD',
    ];
}

/** The whole preview, as the admin screen renders it. */
function invoice_preview(string $planLabel, float $planPrice, int $answersUsed, ?int $allowance, string $period): array {
    $lines = invoice_lines($planLabel, $planPrice, $answersUsed, $allowance);
    return [
        'period'    => $period,
        'lines'     => $lines,
        'totals'    => invoice_totals($lines),
        'has_overage' => count($lines) > 1,
    ];
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $preview = invoice_preview('Department', 24000.0, 63400, 60000, '2026-08');
    foreach ($preview['lines'] as $l) {
        printf("  %-58s %10s%s", $l['description'], number_format($l['amount'], 2), PHP_EOL);
    }
    $t = $preview['totals'];
    printf("%s  %-58s %10s%s", PHP_EOL, 'Subtotal', number_format($t['subtotal'], 2), PHP_EOL);
    printf("  %-58s %10s%s", 'HST (13%)', number_format($t['tax'], 2), PHP_EOL);
    printf("  %-58s %10s %s%s", 'Total', number_format($t['total'], 2), $t['currency'], PHP_EOL);
}

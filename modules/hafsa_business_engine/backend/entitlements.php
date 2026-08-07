<?php
/**
 * Plan entitlements — business engine (slides 17–end).
 *
 * What a licence actually buys. Keeping this in one table is what makes the pricing tiers real
 * rather than marketing: a feature is either in the plan or it is not, and the edge can answer
 * that question without asking upstream.
 *
 * Presentation only — hiding a button is a courtesy, not a control. The hosted API enforces the
 * same limits independently, because anything shipped to a customer can be edited by them.
 * Self-contained and runnable:  php entitlements.php
 */
declare(strict_types=1);

function plans(): array {
    return [
        'starter' => [
            'label'      => 'Starter',
            'seats'      => 250,
            'courses'    => 10,
            'features'   => ['ai_assistant', 'flashcards', 'basic_analytics'],
        ],
        'department' => [
            'label'      => 'Department',
            'seats'      => 1500,
            'courses'    => 60,
            'features'   => ['ai_assistant', 'flashcards', 'basic_analytics',
                             'assessments', 'cohort_analytics', 'lms_import'],
        ],
        'institution' => [
            'label'      => 'Institution',
            'seats'      => null,      // unlimited
            'courses'    => null,
            'features'   => ['ai_assistant', 'flashcards', 'basic_analytics',
                             'assessments', 'cohort_analytics', 'lms_import',
                             'predictive_analytics', 'sso', 'audit_export'],
        ],
    ];
}

/** Is this feature included in the plan? */
function plan_allows(string $plan, string $feature): bool {
    return in_array($feature, plans()[$plan]['features'] ?? [], true);
}

/** Seat check. A null limit means unlimited. */
function within_seats(string $plan, int $activeSeats): bool {
    $limit = plans()[$plan]['seats'] ?? 0;
    return $limit === null || $activeSeats <= $limit;
}

/** The smallest plan that includes a feature — what an upgrade prompt should offer. */
function cheapest_plan_with(string $feature): ?string {
    foreach (plans() as $key => $plan) {
        if (in_array($feature, $plan['features'], true)) return $key;
    }
    return null;
}

/** Everything the UI needs to render a feature as available, or as an upsell. */
function entitlement_state(string $plan, string $feature): array {
    $allowed = plan_allows($plan, $feature);
    return [
        'feature'       => $feature,
        'allowed'       => $allowed,
        'current_plan'  => $plan,
        'requires_plan' => $allowed ? null : cheapest_plan_with($feature),
    ];
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    foreach (['ai_assistant', 'assessments', 'predictive_analytics'] as $f) {
        $s = entitlement_state('starter', $f);
        printf("%-22s %s%s%s", $f, $s['allowed'] ? 'included' : 'needs ' . $s['requires_plan'], '', PHP_EOL);
    }
    echo PHP_EOL, 'starter within 250 seats? ', var_export(within_seats('starter', 240), true), PHP_EOL;
    echo 'starter within 400 seats? ', var_export(within_seats('starter', 400), true), PHP_EOL;
    echo 'institution, 50k seats?  ', var_export(within_seats('institution', 50000), true), PHP_EOL;
}

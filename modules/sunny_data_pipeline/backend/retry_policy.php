<?php
/**
 * Retry policy — data & retrieval (slides 6–9).
 *
 * Generation calls occasionally fail transiently: a timeout, a 503, a rate limit. Retrying blindly
 * is worse than not retrying — it doubles the bill and can turn a struggling upstream into a
 * failing one. So the rules are narrow: only idempotent work, only transient statuses, a small
 * number of attempts, and exponential backoff with jitter so a hundred clients do not all return
 * at the same instant.
 * Self-contained and runnable:  php retry_policy.php
 */
declare(strict_types=1);

const MAX_ATTEMPTS   = 3;
const BASE_DELAY_MS  = 250;
const MAX_DELAY_MS   = 4000;

/** Transient failures only. A 400 or 403 will fail identically next time. */
function should_retry(int $status, int $attempt): bool {
    if ($attempt >= MAX_ATTEMPTS) return false;
    return in_array($status, [408, 429, 500, 502, 503, 504], true);
}

/**
 * Delay before the next attempt: exponential, capped, with jitter.
 * Jitter matters — without it every retry lands simultaneously and re-creates the overload.
 */
function retry_delay_ms(int $attempt): int {
    $exponential = BASE_DELAY_MS * (2 ** max(0, $attempt - 1));
    $capped      = (int)min($exponential, MAX_DELAY_MS);
    $jitter      = random_int(0, (int)($capped * 0.3));   // up to 30% spread
    return $capped + $jitter;
}

/** Honour an upstream Retry-After when it gives one — it knows better than our formula. */
function retry_after_ms(?string $header, int $attempt): int {
    if ($header !== null && is_numeric(trim($header))) {
        return (int)min((float)trim($header) * 1000, MAX_DELAY_MS * 2);
    }
    return retry_delay_ms($attempt);
}

/** The whole schedule, for documentation and tests. */
function retry_plan(int $status): array {
    $plan = [];
    for ($attempt = 1; should_retry($status, $attempt); $attempt++) {
        $plan[] = ['attempt' => $attempt + 1, 'after_ms' => retry_delay_ms($attempt)];
    }
    return $plan;
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    foreach ([503, 429, 400] as $status) {
        $plan = retry_plan($status);
        printf("status %d → %s%s", $status,
            $plan ? count($plan) . ' retries: ' . implode(', ', array_map(
                static fn($p) => "#{$p['attempt']} after {$p['after_ms']}ms", $plan))
                  : 'no retry (not transient)',
            PHP_EOL);
    }
}

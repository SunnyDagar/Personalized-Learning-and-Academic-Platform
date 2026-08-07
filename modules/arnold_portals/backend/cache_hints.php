<?php
/**
 * Cache hints — portals (slides 10–12).
 *
 * Portal screens mix data that barely changes (a course list) with data that must never be stale
 * (a grade that was just released). Getting this wrong in either direction is visible to users, so
 * the policy is written down once rather than guessed at per screen.
 * Self-contained and runnable:  php cache_hints.php
 */
declare(strict_types=1);

/** Seconds a given portal path may be reused for. 0 means never cache. */
function cache_seconds(string $path): int {
    $rules = [
        '#^/public/brand#'      => 3600,  // branding changes at most on a deploy
        '#^/courses#'           => 300,   // a timetable does not move mid-session
        '#^/documents#'         => 120,
        '#^/analytics/#'        => 60,    // trends can lag a minute
        '#^/appointments#'      => 0,     // a just-booked slot must show immediately
        '#^/assessments#'       => 0,     // grades must never be stale
        '#^/chat#'              => 0,
    ];
    foreach ($rules as $pattern => $ttl) {
        if (preg_match($pattern, $path)) return $ttl;
    }
    return 0;   // default to correctness, not speed
}

/** True when a response for this path is safe to share between users. */
function is_public_path(string $path): bool {
    return (bool)preg_match('#^/(public/|health)#', $path);
}

/** Cache-Control header for a path. Anything user-specific is marked private. */
function cache_header(string $path): string {
    $ttl = cache_seconds($path);
    if ($ttl === 0) return 'Cache-Control: no-store';
    $scope = is_public_path($path) ? 'public' : 'private';
    return "Cache-Control: {$scope}, max-age={$ttl}";
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    foreach (['/public/brand', '/courses', '/analytics/my-trend', '/assessments', '/chat'] as $p) {
        printf("%-22s %s%s", $p, cache_header($p), PHP_EOL);
    }
}

<?php
/**
 * Unit tests for portal edge route validation — Arnold Babu (Day 3).
 * Run via: php test_routes.php
 */
declare(strict_types=1);

require_once __DIR__ . '/routes.php';

function run_route_tests(): void {
    echo "--- Running Portal Edge Route Validation Tests ---\n";

    // 1. Test all Student & Professor endpoints from portal_endpoints.md
    $allowed_cases = [
        // Student endpoints
        ['POST', '/auth/login'],
        ['GET', '/courses/by-professor'],
        ['GET', '/documents'],
        ['POST', '/chat'],
        ['POST', '/quiz/generate'],
        ['POST', '/flashcards/generate'],
        ['GET', '/analytics/my-stats'],
        ['GET', '/analytics/my-trend'],
        ['GET', '/analytics/my-mastery'],
        ['GET', '/assessments'],
        ['GET', '/appointments'],
        ['GET', '/notifications'],
        // Professor endpoints
        ['GET', '/courses'],
        ['POST', '/documents/upload'],
        ['POST', '/assessments/ai-generate'],
        ['GET', '/assessments/42/results'],
        ['GET', '/assessments/submissions/101'],
        ['GET', '/analytics/course/15'],
    ];

    foreach ($allowed_cases as [$method, $path]) {
        assert(
            edge_route_allowed($method, $path) === true,
            "FAILED: Allowed route '{$method} {$path}' was rejected."
        );
        echo "PASSED: Allowed '{$method} {$path}'\n";
    }

    // 2. Test unlisted / malicious paths (must be rejected)
    $rejected_cases = [
        ['GET', '/admin/secret-keys'],
        ['POST', '/users/delete-all'],
        ['DELETE', '/courses/1'],
        ['PUT', '/assessments/1'],
        ['GET', '/analytics/internal-debug'],
        ['POST', '/assessments/ai-generate/unauthorized'],
    ];

    foreach ($rejected_cases as [$method, $path]) {
        assert(
            edge_route_allowed($method, $path) === false,
            "FAILED: Unlisted route '{$method} {$path}' was unexpectedly allowed."
        );
        echo "PASSED: Rejected unlisted '{$method} {$path}'\n";
    }

    echo "--- All Portal Edge Route Tests Passed Successfully! ---\n";
}

run_route_tests();
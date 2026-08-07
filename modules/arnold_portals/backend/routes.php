<?php
/**
 * Edge route map — portals area (slides 10–12).
 *
 * Declares which UI paths the edge is allowed to forward. Anything not listed is rejected at the
 * edge rather than passed upstream, so the customer's deployment presents a fixed, known surface
 * and cannot be used to probe the API for endpoints it was never licensed to call.
 */
declare(strict_types=1);

/** method => list of allowed path patterns (regex, anchored). */
const EDGE_ROUTES = [
    'POST' => [
        '#^/auth/(login|register)$#',
        '#^/chat$#',
        '#^/quiz/(generate|result)$#',
        '#^/flashcards/generate$#',
        '#^/documents/upload$#',
        '#^/assessments(/(ai-generate|\d+/submit))?$#',
        '#^/appointments/\d+/confirm$#',
        '#^/notify$#',
    ],
    'GET' => [
        '#^/health$#',
        '#^/auth/me$#',
        '#^/courses(/by-professor)?$#',
        '#^/documents(/\d+/download)?$#',
        '#^/chat/history$#',
        '#^/analytics/(my-stats|my-trend|my-mastery|course/\d+)$#',
        '#^/assessments(/\d+/(take|results))?$#',
        '#^/assessments/submissions/\d+$#',
        '#^/appointments$#',
        '#^/notifications$#',
        '#^/public/brand$#',
    ],
];

function edge_route_allowed(string $method, string $path): bool {
    foreach (EDGE_ROUTES[strtoupper($method)] ?? [] as $re) {
        if (preg_match($re, $path)) return true;
    }
    return false;
}

function edge_route_guard(string $method, string $path): void {
    if (!edge_route_allowed($method, $path)) {
        http_response_code(404);
        if (function_exists('obs_record') && isset($GLOBALS['t0'])) obs_record($method, $path, 404, $GLOBALS['t0']);
        echo json_encode(['detail' => 'Not found.']);
        exit;
    }
}
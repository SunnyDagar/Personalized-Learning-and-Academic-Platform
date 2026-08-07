<?php
/**
 * CORS policy — core foundations (slides 1–5).
 *
 * An institution may host the portal on its own domain while the API stays with us, so the edge
 * has to answer cross-origin requests. Reflecting any Origin back with credentials enabled would
 * let any site on the internet call the API using a signed-in student's session, so the allowed
 * origins are configured explicitly and anything else is simply not granted CORS.
 */
declare(strict_types=1);

/** Origins permitted to call this deployment. Institutions add their own portal host here. */
function cors_allowed_origins(): array {
    return [
        'https://dagarretail.com',
        'http://127.0.0.1:8080',
        'http://localhost:4200',    // Angular dev server
    ];
}

function cors_is_allowed(string $origin): bool {
    return $origin !== '' && in_array($origin, cors_allowed_origins(), true);
}

/**
 * Emit CORS headers for the current request.
 * Returns true when the request is a preflight and the caller should stop.
 */
function cors_apply(): bool {
    $origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');

    if (cors_is_allowed($origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
    // Vary regardless, so a cached response for one origin is never reused for another.
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-Id');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Max-Age: 600');

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        return true;
    }
    return false;
}

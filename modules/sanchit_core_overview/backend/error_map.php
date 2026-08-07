<?php
/**
 * Error shaping — core foundations (slides 1–5).
 *
 * The edge must never pass an upstream failure through verbatim: stack traces, SQL fragments and
 * internal route names are exactly what an attacker wants, and are meaningless to a student. Every
 * failure is mapped to a stable status plus a sentence a person can act on.
 */
declare(strict_types=1);

/** Human-facing message for a status code, with a sensible fallback. */
function error_message(int $status): string {
    return [
        400 => 'That request was not valid. Please check what you entered and try again.',
        401 => 'Your session has ended. Please sign in again.',
        403 => 'You do not have access to that.',
        404 => 'We could not find what you asked for.',
        409 => 'That conflicts with something that already exists.',
        413 => 'That file is too large to upload.',
        429 => 'Too many requests. Please wait a moment and try again.',
        503 => 'The service is temporarily unavailable. Please try again shortly.',
    ][$status] ?? 'Something went wrong at our end. Please try again.';
}

/**
 * Normalise an upstream response into a safe client payload.
 * Any 5xx is collapsed to a generic message — internal detail never reaches the browser.
 */
function map_error(int $status, ?string $upstreamBody = null): array {
    $out = ['detail' => error_message($status), 'status' => $status];

    // Pass through an upstream 'detail' only when it is short, plain and clearly user-facing.
    if ($status < 500 && $upstreamBody !== null) {
        $decoded = json_decode($upstreamBody, true);
        $detail  = is_array($decoded) ? ($decoded['detail'] ?? null) : null;
        if (is_string($detail) && $detail !== '' && strlen($detail) <= 200
            && !preg_match('/(SELECT |INSERT |Stack trace|#\d |\.php)/i', $detail)) {
            $out['detail'] = $detail;
        }
    }
    return $out;
}

/** True when a failed request is worth retrying rather than surfacing immediately. */
function is_retryable(int $status): bool {
    return in_array($status, [408, 429, 502, 503, 504], true);
}

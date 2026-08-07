<?php
/**
 * Session token relay — core foundations (slides 1–5).
 *
 * The edge forwards a student's bearer token upstream but never interprets it: signature
 * verification is the API's job, and duplicating that here would put the signing key in software
 * we hand to customers. What the edge does do is refuse to forward anything that is not a
 * well-formed token, so malformed input is rejected before it costs an upstream round trip.
 */
declare(strict_types=1);

/** Extract the bearer token from the incoming request, or '' if absent/malformed. */
function relay_token(): string {
    $header = (string)($_SERVER['HTTP_AUTHORIZATION'] ?? '');
    if ($header === '' && function_exists('apache_request_headers')) {
        $header = (string)(apache_request_headers()['Authorization'] ?? '');
    }
    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) return '';
    return looks_like_jwt($m[1]) ? $m[1] : '';
}

/** Shape check only — three base64url segments. Never a validity check. */
function looks_like_jwt(string $token): bool {
    return (bool)preg_match('/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/', $token);
}

/**
 * Unverified read of the payload, for display only — e.g. showing a name in the header before the
 * first API call returns. Anything that matters is decided upstream against the signature.
 */
function token_claims_unverified(string $token): array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return [];
    $json = base64_decode(strtr($parts[1], '-_', '+/') . str_repeat('=', -strlen($parts[1]) % 4), true);
    $data = $json === false ? null : json_decode($json, true);
    return is_array($data) ? $data : [];
}

/** Seconds until the token expires; negative once it has. */
function token_seconds_remaining(string $token): int {
    $exp = token_claims_unverified($token)['exp'] ?? null;
    return is_numeric($exp) ? (int)$exp - time() : 0;
}

/** Header lines to forward upstream, omitting the token entirely when there isn't a valid one. */
function relay_headers(): array {
    $token = relay_token();
    return $token === '' ? [] : ['Authorization: Bearer ' . $token];
}

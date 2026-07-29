<?php
/**
 * Edge response cache — data/AI area (slides 6–9).
 *
 * Retrieval-backed answers are expensive: an embedding call plus a generation call. Identical
 * repeat questions within a short window are served from the edge instead of billing another
 * round trip. Only safe, idempotent GETs and clearly repeatable reads are cached; anything
 * carrying a user's session token is keyed to that token so answers never leak between users.
 */
declare(strict_types=1);

const EDGE_CACHE_TTL = 300; // seconds

function edge_cache_key(string $method, string $path, string $body, string $token): ?string {
    // never cache writes
    if (!in_array(strtoupper($method), ['GET'], true)) return null;
    // per-user, per-path
    return sys_get_temp_dir() . '/edge_cache_' . md5($method . '|' . $path . '|' . $body . '|' . $token) . '.json';
}

function edge_cache_get(?string $key): ?string {
    if (!$key || !is_readable($key)) return null;
    $blob = json_decode((string)file_get_contents($key), true);
    if (!is_array($blob) || ($blob['exp'] ?? 0) < time()) return null;
    return (string)$blob['body'];
}

function edge_cache_put(?string $key, string $body, int $status): void {
    if (!$key || $status < 200 || $status >= 300) return;   // only cache successes
    @file_put_contents($key, json_encode(['exp' => time() + EDGE_CACHE_TTL, 'body' => $body]), LOCK_EX);
}

<?php
/**
 * In-flight request de-duplication — data & retrieval (slides 6–9).
 *
 * Double-clicking "Ask" fires the same expensive question twice. The response cache cannot help,
 * because nothing has returned yet to cache. This holds a short-lived marker while a question is
 * in flight, so the duplicate is refused instead of paying for a second embedding and generation.
 *
 * The lock is deliberately short and always expires on its own: a crashed request must never leave
 * a student unable to ask anything.
 * Self-contained and runnable:  php request_dedupe.php
 */
declare(strict_types=1);

const INFLIGHT_TTL = 20;   // seconds — longer than a normal answer, short enough to self-heal

function inflight_path(string $key): string {
    return sys_get_temp_dir() . '/inflight_' . $key . '.lock';
}

/**
 * Claim the right to run this request.
 * Returns true when the caller owns it, false when an identical one is already running.
 */
function inflight_claim(string $key): bool {
    $path = inflight_path($key);

    if (is_readable($path)) {
        $startedAt = (int)file_get_contents($path);
        if (time() - $startedAt < INFLIGHT_TTL) {
            return false;                 // a live duplicate
        }
        @unlink($path);                   // stale — the previous attempt died
    }
    return @file_put_contents($path, (string)time(), LOCK_EX) !== false;
}

/** Always call this when the request finishes, successfully or not. */
function inflight_release(string $key): void {
    @unlink(inflight_path($key));
}

/** What to tell the user whose duplicate was refused. */
function inflight_response(): array {
    return ['detail' => 'That question is already being answered — one moment.', 'status' => 409];
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $key = 'demo_' . bin2hex(random_bytes(4));

    echo 'first click  : ', inflight_claim($key) ? 'proceeds' : 'refused', PHP_EOL;
    echo 'second click : ', inflight_claim($key) ? 'proceeds' : 'refused (duplicate avoided)', PHP_EOL;

    inflight_release($key);
    echo 'after finish : ', inflight_claim($key) ? 'proceeds again' : 'refused', PHP_EOL;
    inflight_release($key);
}

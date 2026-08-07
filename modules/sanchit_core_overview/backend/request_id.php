<?php
/**
 * Request correlation — core foundations (slides 1–5).
 *
 * Every request that leaves the edge carries an X-Request-Id. When a student reports "the page
 * broke at 2pm", that id is the only thing linking what they saw to the upstream log line. It is
 * generated here rather than upstream so the id also covers requests the edge rejects on its own.
 */
declare(strict_types=1);

function request_id(): string {
    static $id = null;
    if ($id !== null) return $id;

    // Honour an id supplied by a caller (useful when a portal fans out several calls for one
    // user action), but only if it looks like ours — never echo arbitrary header content back.
    $supplied = (string)($_SERVER['HTTP_X_REQUEST_ID'] ?? '');
    if ($supplied !== '' && preg_match('/^[A-Za-z0-9-]{8,64}$/', $supplied)) {
        return $id = $supplied;
    }
    return $id = 'req_' . bin2hex(random_bytes(8));
}

/** Header line to forward upstream. */
function request_id_header(): string {
    return 'X-Request-Id: ' . request_id();
}

/** Attach the id to a JSON error body so the user can quote it in a bug report. */
function with_request_id(array $payload): array {
    $payload['request_id'] = request_id();
    return $payload;
}

<?php
/**
 * Tenant licence check — business area (slides 17+).
 *
 * The commercial control point on the customer's side. Every request carries the tenant key
 * issued with the licence; this validates that one is configured and well-formed before any
 * traffic leaves the edge, and turns an upstream 403 into a message an administrator can act on.
 *
 * The authoritative check is server-side — a key can be revoked at any moment and this cannot
 * override that. This exists to fail fast and fail clearly.
 */
declare(strict_types=1);

function licence_key_present(array $cfg): bool {
    $k = trim((string)($cfg['TENANT_KEY'] ?? ''));
    return $k !== '' && $k !== 'CHANGE_ME';
}

/** Shape check only — never a claim that the licence is currently valid. */
function licence_key_well_formed(string $key): bool {
    return (bool)preg_match('/^ck_[0-9a-f]{16,32}$/', $key);
}

function licence_guard(array $cfg): void {
    if (!licence_key_present($cfg)) {
        http_response_code(503);
        echo json_encode(['detail' => 'No licence configured. Set TENANT_KEY in server-edge/config.php.']);
        exit;
    }
}

/** Translate the upstream licence responses into something an admin understands. */
function licence_explain(int $upstreamStatus): ?string {
    return match ($upstreamStatus) {
        401 => 'Licence key not recognised. Contact your provider.',
        403 => 'This licence has been suspended or has expired.',
        503 => 'The service is locked pending activation by an administrator.',
        default => null,
    };
}

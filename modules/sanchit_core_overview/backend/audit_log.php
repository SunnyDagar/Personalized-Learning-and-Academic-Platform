<?php
/**
 * Audit trail — core foundations (slides 1–5).
 *
 * Institutions buying software that touches student records ask who did what and when. Recording
 * it at the edge means the answer exists even for actions the edge refused on its own, which is
 * exactly the case a security review asks about.
 *
 * What is deliberately not recorded: request bodies, question text, passwords, tokens. An audit
 * log that quietly accumulates student work becomes the biggest privacy liability in the product.
 * Self-contained and runnable:  php audit_log.php
 */
declare(strict_types=1);

const AUDIT_MAX_ENTRIES = 2000;

function audit_path(): string {
    return sys_get_temp_dir() . '/audit_log.jsonl';
}

/** Actions worth recording — everything else is ordinary reading. */
function is_auditable(string $method, string $path): bool {
    if (in_array(strtoupper($method), ['POST', 'PATCH', 'PUT', 'DELETE'], true)) return true;
    return (bool)preg_match('#^/(auth/|documents|assessments)#', $path);
}

/**
 * Append one entry. Actor is a pseudonym, never the token or an email address.
 */
function audit_record(string $actor, string $method, string $path, int $status, array $extra = []): void {
    if (!is_auditable($method, $path)) return;

    $entry = array_merge([
        'at'     => gmdate('c'),
        'actor'  => substr(hash('sha256', $actor), 0, 12),
        'action' => strtoupper($method) . ' ' . $path,
        'status' => $status,
        'result' => $status < 400 ? 'success' : ($status < 500 ? 'refused' : 'error'),
    ], $extra);

    @file_put_contents(audit_path(), json_encode($entry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    trim_audit_log();
}

/** Keep the file bounded — an unbounded log on a customer's server is a support call. */
function trim_audit_log(): void {
    $path = audit_path();
    if (!is_readable($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    if (count($lines) > AUDIT_MAX_ENTRIES) {
        @file_put_contents($path, implode(PHP_EOL, array_slice($lines, -AUDIT_MAX_ENTRIES)) . PHP_EOL, LOCK_EX);
    }
}

function audit_read(int $limit = 20): array {
    $path  = audit_path();
    if (!is_readable($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    return array_map(
        static fn(string $l): array => json_decode($l, true) ?: [],
        array_slice($lines, -$limit)
    );
}

/** Counts by result — the shape an administrator's security page renders. */
function audit_summary(): array {
    $summary = ['success' => 0, 'refused' => 0, 'error' => 0];
    foreach (audit_read(AUDIT_MAX_ENTRIES) as $e) {
        $key = $e['result'] ?? 'success';
        $summary[$key] = ($summary[$key] ?? 0) + 1;
    }
    return $summary;
}

function audit_reset(): void {
    @unlink(audit_path());
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    audit_reset();
    audit_record('token-prof', 'POST', '/documents/upload', 201);
    audit_record('token-prof', 'POST', '/assessments', 201);
    audit_record('token-anon', 'POST', '/auth/login', 401);
    audit_record('token-stud', 'GET',  '/courses', 200);   // not auditable, ignored

    foreach (audit_read() as $e) {
        printf("%-6s %-28s %s%s", $e['result'], $e['action'], $e['actor'], PHP_EOL);
    }
    echo PHP_EOL;
    print_r(audit_summary());
    audit_reset();
}

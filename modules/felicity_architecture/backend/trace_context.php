<?php
/**
 * Trace context — architecture (slides 13–16).
 *
 * One student action can become several API calls. Without a shared trace id, a report of "it was
 * slow" cannot be tied to the span that was actually slow. This follows the W3C traceparent format
 * so the ids stay meaningful if an institution ever puts its own tooling in front of the edge.
 * Self-contained and runnable:  php trace_context.php
 */
declare(strict_types=1);

/** Start a new trace, or continue one supplied by the caller. */
function trace_context(): array {
    static $ctx = null;
    if ($ctx !== null) return $ctx;

    $incoming = (string)($_SERVER['HTTP_TRACEPARENT'] ?? '');
    if (preg_match('/^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/', $incoming, $m)) {
        return $ctx = ['trace_id' => $m[1], 'parent_id' => $m[2], 'span_id' => new_span_id(), 'sampled' => $m[3] !== '00'];
    }
    return $ctx = [
        'trace_id'  => bin2hex(random_bytes(16)),
        'parent_id' => null,
        'span_id'   => new_span_id(),
        'sampled'   => true,
    ];
}

function new_span_id(): string {
    return bin2hex(random_bytes(8));
}

/** The header to pass downstream so the next hop joins the same trace. */
function traceparent_header(): string {
    $c = trace_context();
    return sprintf('traceparent: 00-%s-%s-%s', $c['trace_id'], $c['span_id'], $c['sampled'] ? '01' : '00');
}

/** Open a child span for one unit of work. */
function span_start(string $name): array {
    return ['name' => $name, 'span_id' => new_span_id(), 'started' => microtime(true)];
}

/** Close a span and return it as a loggable record. */
function span_end(array $span, string $status = 'ok'): array {
    $c = trace_context();
    return [
        'trace_id'    => $c['trace_id'],
        'span_id'     => $span['span_id'],
        'parent_id'   => $c['span_id'],
        'name'        => $span['name'],
        'duration_ms' => round((microtime(true) - $span['started']) * 1000, 1),
        'status'      => $status,
    ];
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    echo traceparent_header(), PHP_EOL, PHP_EOL;
    $s = span_start('retrieve_course_material');
    usleep(40_000);
    print_r(span_end($s));
}

<?php
/**
 * Response shaping — portals (slides 10–12).
 *
 * Both portals render from the same endpoints, so every list answer is wrapped in one predictable
 * envelope. Without it each screen guesses at the shape and breaks differently when a field is
 * absent. Self-contained and runnable:  php response_shape.php
 */
declare(strict_types=1);

/** Standard envelope for a collection. */
function shape_list(array $items, ?array $meta = null): array {
    return ['data' => array_values($items), 'meta' => $meta ?? ['count' => count($items)]];
}

/** Standard envelope for a single record. */
function shape_item(?array $item): array {
    return ['data' => $item];
}

/**
 * Keep only the fields a portal screen actually renders.
 * Trimming here keeps payloads small and stops incidental fields leaking into the UI.
 */
function pick(array $row, array $fields): array {
    $out = [];
    foreach ($fields as $f) {
        if (array_key_exists($f, $row)) $out[$f] = $row[$f];
    }
    return $out;
}

/** Apply pick() across a collection. */
function pick_all(array $rows, array $fields): array {
    return array_map(static fn(array $r): array => pick($r, $fields), $rows);
}

/**
 * Fill in the fields a template expects so a missing value renders as a blank rather than
 * throwing. A card that shows "—" is a far better failure than a portal that will not paint.
 */
function with_defaults(array $row, array $defaults): array {
    foreach ($defaults as $k => $v) {
        if (!array_key_exists($k, $row) || $row[$k] === null) $row[$k] = $v;
    }
    return $row;
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $rows = [
        ['id' => 1, 'title' => 'Generative AI', 'code' => 'AIDI2005', 'internal_note' => 'do not ship'],
        ['id' => 4, 'title' => 'Knowledge Systems', 'code' => 'AIDI2001'],
    ];
    $clean = pick_all($rows, ['id', 'code', 'title']);
    $clean = array_map(static fn($r) => with_defaults($r, ['progress' => 0]), $clean);
    echo json_encode(shape_list($clean, ['count' => count($clean), 'page' => 1]),
                     JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), PHP_EOL;
}

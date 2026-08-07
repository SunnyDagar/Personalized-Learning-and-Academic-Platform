<?php
/**
 * List pagination — portals (slides 10–12).
 *
 * A professor with three hundred students should not receive three hundred rows in one response.
 * The portal asks for a page; this works out the window and the navigation state around it.
 * Self-contained and runnable on its own:  php pagination.php
 */
declare(strict_types=1);

const PAGE_SIZE_DEFAULT = 25;
const PAGE_SIZE_MAX     = 100;

/** Clamp user-supplied paging input into something safe to act on. */
function page_window(int $page, int $perPage = PAGE_SIZE_DEFAULT): array {
    $page    = max(1, $page);
    $perPage = min(PAGE_SIZE_MAX, max(1, $perPage));
    return ['page' => $page, 'per_page' => $perPage, 'offset' => ($page - 1) * $perPage];
}

/** Everything the portal needs to render "Showing 26–50 of 312" and its buttons. */
function paginate(int $total, int $page, int $perPage = PAGE_SIZE_DEFAULT): array {
    $w     = page_window($page, $perPage);
    $pages = $total > 0 ? (int)ceil($total / $w['per_page']) : 1;
    $page  = min($w['page'], $pages);
    $from  = $total === 0 ? 0 : ($page - 1) * $w['per_page'] + 1;
    $to    = min($page * $w['per_page'], $total);

    return [
        'page'        => $page,
        'per_page'    => $w['per_page'],
        'total'       => $total,
        'total_pages' => $pages,
        'from'        => $from,
        'to'          => $to,
        'has_prev'    => $page > 1,
        'has_next'    => $page < $pages,
        'label'       => $total === 0 ? 'No results' : "Showing {$from}–{$to} of {$total}",
    ];
}

/** Page numbers to render, collapsing long ranges with gaps. */
function page_links(int $totalPages, int $current, int $around = 2): array {
    if ($totalPages <= 1) return [1];
    $keep = [1, $totalPages];
    for ($i = $current - $around; $i <= $current + $around; $i++) {
        if ($i >= 1 && $i <= $totalPages) $keep[] = $i;
    }
    $keep = array_values(array_unique($keep));
    sort($keep);

    $out = [];
    $prev = 0;
    foreach ($keep as $n) {
        if ($prev && $n - $prev > 1) $out[] = '…';
        $out[] = $n;
        $prev  = $n;
    }
    return $out;
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $p = paginate(312, 2);
    echo $p['label'], PHP_EOL;
    echo 'page ', $p['page'], ' of ', $p['total_pages'], PHP_EOL;
    echo 'links: ', implode(' ', page_links($p['total_pages'], 2)), PHP_EOL;
    echo 'oversized request clamped to: ', page_window(1, 5000)['per_page'], PHP_EOL;
}

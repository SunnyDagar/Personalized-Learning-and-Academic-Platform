<?php
/**
 * Cache key derivation — data & retrieval (slides 6–9).
 *
 * Deciding what counts as "the same question" is the whole cache. Too strict and every rephrasing
 * pays for another embedding plus another generation; too loose and one student sees an answer
 * built for another student's courses.
 *
 * The rule here is deliberately conservative: normalise only what cannot change meaning (case,
 * spacing, trailing punctuation), and always key on the user and the course. Two people asking an
 * identical question about different courses must never share an entry.
 * Self-contained and runnable:  php cache_key.php
 */
declare(strict_types=1);

/** Normalise a question so trivial differences hit the same entry. */
function normalise_question(string $q): string {
    $q = mb_strtolower(trim($q));
    $q = preg_replace('/\s+/u', ' ', $q) ?? $q;
    // Trailing punctuation carries no meaning for retrieval.
    return rtrim($q, " \t\n?!.");
}

/**
 * Cache identity for one retrieval-backed answer.
 * The user is included because answers are personalised; the course because scope decides content.
 */
function answer_cache_key(string $userToken, int $courseId, string $question): string {
    return hash('sha256', implode("\0", [
        'v1',
        hash('sha256', $userToken),   // never store the raw token
        (string)$courseId,
        normalise_question($question),
    ]));
}

/** Would these two questions share a cache entry? */
function same_question(string $a, string $b): bool {
    return normalise_question($a) === normalise_question($b);
}

/**
 * Only deterministic, read-only work is cacheable. Anything that writes, or whose answer is
 * expected to differ each time (a freshly generated quiz), must not be.
 */
function is_cacheable(string $method, string $path): bool {
    if (strtoupper($method) !== 'GET' && $path !== '/chat') return false;
    foreach (['#^/quiz/generate#', '#^/flashcards/generate#', '#^/assessments#', '#^/appointments#'] as $never) {
        if (preg_match($never, $path)) return false;
    }
    return true;
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $t = 'example-token';
    $a = answer_cache_key($t, 1, 'What is recursion?');
    $b = answer_cache_key($t, 1, '  what is RECURSION  ');
    $c = answer_cache_key($t, 5, 'What is recursion?');

    echo 'same wording, same course  : ', $a === $b ? 'HIT  (as intended)' : 'miss', PHP_EOL;
    echo 'same wording, other course : ', $a === $c ? 'HIT  (WRONG)' : 'miss (as intended)', PHP_EOL;
    echo PHP_EOL;
    echo '/chat cacheable          : ', var_export(is_cacheable('POST', '/chat'), true), PHP_EOL;
    echo '/quiz/generate cacheable : ', var_export(is_cacheable('POST', '/quiz/generate'), true), PHP_EOL;
}

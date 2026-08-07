<?php
/**
 * Query logging — data & retrieval (slides 6–9).
 *
 * Refused questions are the most valuable signal the platform produces: they show exactly where a
 * course's material has gaps. But a student's questions are sensitive, so what is retained is
 * deliberately minimal — the topic shape and the outcome, never the identity.
 *
 * The user is stored as a salted one-way digest so repeat patterns can be counted without anyone,
 * including us, being able to work backwards to a person. This is the privacy position the report
 * commits to, implemented rather than asserted.
 * Self-contained and runnable:  php query_log.php
 */
declare(strict_types=1);

const QUERY_LOG_MAX = 1000;

function query_log_path(): string {
    return sys_get_temp_dir() . '/query_log.json';
}

/** Per-install salt, so digests cannot be compared across deployments. */
function log_salt(): string {
    static $salt = null;
    if ($salt !== null) return $salt;
    $path = sys_get_temp_dir() . '/query_log_salt';
    if (is_readable($path)) return $salt = (string)file_get_contents($path);
    $salt = bin2hex(random_bytes(16));
    @file_put_contents($path, $salt);
    return $salt;
}

/** One-way, salted, truncated — enough to count repeats, useless for identifying anyone. */
function pseudonymise(string $userToken): string {
    return substr(hash_hmac('sha256', $userToken, log_salt()), 0, 12);
}

/**
 * Record the shape of a query and what happened to it.
 * The question text itself is never stored — only its length and word count.
 */
function query_log_record(string $userToken, int $courseId, string $question, bool $answered, ?float $topScore = null): void {
    $entry = [
        'at'         => gmdate('c'),
        'user'       => pseudonymise($userToken),
        'course_id'  => $courseId,
        'words'      => str_word_count($question),
        'chars'      => mb_strlen($question),
        'answered'   => $answered,
        'top_score'  => $topScore !== null ? round($topScore, 3) : null,
    ];

    $path = query_log_path();
    $log  = is_readable($path) ? (json_decode((string)file_get_contents($path), true) ?: []) : [];
    $log[] = $entry;
    if (count($log) > QUERY_LOG_MAX) $log = array_slice($log, -QUERY_LOG_MAX);
    @file_put_contents($path, json_encode($log), LOCK_EX);
}

/** Where is the material thin? Refusal rate per course is the answer. */
function coverage_report(): array {
    $path = query_log_path();
    $log  = is_readable($path) ? (json_decode((string)file_get_contents($path), true) ?: []) : [];

    $byCourse = [];
    foreach ($log as $e) {
        $id = $e['course_id'];
        $byCourse[$id] ??= ['course_id' => $id, 'asked' => 0, 'refused' => 0];
        $byCourse[$id]['asked']++;
        if (!$e['answered']) $byCourse[$id]['refused']++;
    }
    foreach ($byCourse as &$c) {
        $c['refusal_rate_pct'] = $c['asked'] ? round($c['refused'] / $c['asked'] * 100, 1) : 0.0;
        $c['action'] = $c['refusal_rate_pct'] >= 25
            ? 'Material likely has gaps — review what students are asking about'
            : 'Coverage looks healthy';
    }
    return array_values($byCourse);
}

function query_log_reset(): void {
    @unlink(query_log_path());
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    query_log_reset();
    for ($i = 0; $i < 40; $i++) {
        query_log_record('token-a', 1, 'a question about the course', $i % 10 !== 0, 0.71);
    }
    for ($i = 0; $i < 20; $i++) {
        query_log_record('token-b', 5, 'something not covered here', $i % 2 === 0, 0.48);
    }
    print_r(coverage_report());
    echo 'stored user id looks like: ', pseudonymise('token-a'), ' (irreversible)', PHP_EOL;
    query_log_reset();
}

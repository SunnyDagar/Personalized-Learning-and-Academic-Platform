<?php
/**
 * Payload limits — data & retrieval (slides 6–9).
 *
 * The edge is where a bad request should die. A 400-page PDF or a 50,000-character question costs
 * real money once it reaches embedding and generation, so the cheapest place to refuse it is
 * before it leaves the customer's own server.
 *
 * Every limit is stated with a reason: an arbitrary cap that nobody can explain gets raised the
 * first time someone complains, which defeats the point.
 * Self-contained and runnable:  php payload_limits.php
 */
declare(strict_types=1);

const MAX_QUESTION_CHARS = 2000;      // beyond this a question is a document, not a question
const MAX_UPLOAD_BYTES   = 20971520;  // 20 MB — a term of lecture slides, comfortably
const ALLOWED_UPLOAD_EXT = ['pdf', 'docx', 'txt', 'md'];

/** Check a chat question before it costs an embedding call. */
function check_question(string $question): array {
    $trimmed = trim($question);

    if ($trimmed === '') {
        return fail('Please type a question first.');
    }
    if (mb_strlen($trimmed) > MAX_QUESTION_CHARS) {
        return fail(sprintf(
            'That question is %s characters; the limit is %s. Try asking about one thing at a time.',
            number_format(mb_strlen($trimmed)), number_format(MAX_QUESTION_CHARS)
        ));
    }
    // A question made only of punctuation retrieves nothing and still costs a call.
    if (!preg_match('/[\p{L}\p{N}]/u', $trimmed)) {
        return fail('That question does not contain any words to search for.');
    }
    return ['ok' => true, 'value' => $trimmed];
}

/** Check an upload before it is streamed upstream. */
function check_upload(string $filename, int $bytes): array {
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

    if (!in_array($ext, ALLOWED_UPLOAD_EXT, true)) {
        return fail(sprintf(
            'We cannot read .%s files. Supported formats: %s.',
            $ext ?: '(none)', implode(', ', ALLOWED_UPLOAD_EXT)
        ));
    }
    if ($bytes <= 0) {
        return fail('That file appears to be empty.');
    }
    if ($bytes > MAX_UPLOAD_BYTES) {
        return fail(sprintf(
            'That file is %s MB; the limit is %s MB. Splitting it by week usually works well.',
            round($bytes / 1048576, 1), round(MAX_UPLOAD_BYTES / 1048576)
        ));
    }
    return ['ok' => true, 'value' => $filename];
}

function fail(string $reason): array {
    return ['ok' => false, 'detail' => $reason];
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $cases = [
        'normal question' => check_question('What stops a recursion?'),
        'empty question'  => check_question('   '),
        'punctuation'     => check_question('???'),
        'huge question'   => check_question(str_repeat('a', 2500)),
        'good upload'     => check_upload('week3.pdf', 4_000_000),
        'wrong type'      => check_upload('slides.pptx', 1_000_000),
        'too large'       => check_upload('everything.pdf', 60_000_000),
    ];
    foreach ($cases as $name => $r) {
        printf("%-16s %-7s %s%s", $name, $r['ok'] ? 'OK' : 'REFUSE', $r['detail'] ?? '', PHP_EOL);
    }
}

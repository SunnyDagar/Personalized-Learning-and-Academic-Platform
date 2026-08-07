<?php
/**
 * Answer guard — data & retrieval (slides 6–9).
 *
 * The last check before a generated answer reaches a student. The grounding gate upstream decides
 * whether to answer at all; this checks that what came back is fit to display.
 *
 * The important case is a model that hedges — "I don't have information about that" — while the
 * pipeline still reports success. Passing that through would show an apology dressed as an answer,
 * when the honest response is the refusal notice with its suggestions.
 * Self-contained and runnable:  php answer_guard.php
 */
declare(strict_types=1);

const MIN_ANSWER_CHARS = 15;

/** Phrases that mean the model declined, however politely. */
function hedging_patterns(): array {
    return [
        '/\bi (?:do not|don\'t) have (?:enough )?(?:any )?information\b/i',
        '/\b(?:the )?(?:provided |given )?(?:context|material|document)s? (?:do(?:es)? not|don\'t) (?:contain|mention|cover)\b/i',
        '/\bi (?:cannot|can\'t|am unable to) (?:answer|find|determine)\b/i',
        '/\bnot (?:covered|mentioned|discussed) in (?:the|this) (?:course|material)\b/i',
        '/\bas an ai (?:language )?model\b/i',
    ];
}

/**
 * Decide whether an answer should be shown.
 * Returns ['show' => bool, 'reason' => string] — reason is for logging, never for the student.
 */
function check_answer(string $answer, array $sources = []): array {
    $trimmed = trim($answer);

    if ($trimmed === '' || mb_strlen($trimmed) < MIN_ANSWER_CHARS) {
        return ['show' => false, 'reason' => 'empty_or_too_short'];
    }
    foreach (hedging_patterns() as $pattern) {
        if (preg_match($pattern, $trimmed)) {
            return ['show' => false, 'reason' => 'model_declined'];
        }
    }
    // An answer with no supporting passages is ungrounded by definition.
    if ($sources === []) {
        return ['show' => false, 'reason' => 'no_sources'];
    }
    return ['show' => true, 'reason' => 'ok'];
}

/** Strip anything the model may have echoed that should not be rendered as-is. */
function sanitise_answer(string $answer): string {
    // Models occasionally wrap output in fences; the UI renders markdown itself.
    $answer = preg_replace('/^```[a-z]*\n(.*)\n```$/su', '$1', trim($answer)) ?? $answer;
    return trim($answer);
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $sources = [['title' => 'Week 3 notes', 'chunk' => 4]];
    $cases = [
        'good answer'  => ['A base case is the condition that stops a recursion.', $sources],
        'hedged'       => ['I do not have information about that in the provided context.', $sources],
        'model preamble' => ['As an AI language model, I cannot answer that.', $sources],
        'too short'    => ['Yes.', $sources],
        'no sources'   => ['A base case stops the recursion from continuing.', []],
    ];
    foreach ($cases as $name => [$answer, $src]) {
        $r = check_answer($answer, $src);
        printf("%-16s %-7s %s%s", $name, $r['show'] ? 'SHOW' : 'REFUSE', $r['reason'], PHP_EOL);
    }
}

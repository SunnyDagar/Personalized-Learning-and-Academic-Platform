<?php
/**
 * Input validation — core foundations (slides 1–5).
 *
 * Rejecting malformed input at the edge saves a round trip and produces a better message than a
 * generic upstream 400. This is a convenience layer, never a security boundary: the API validates
 * everything again, because anything shipped to a customer can be edited by that customer.
 * Self-contained and runnable:  php input_validation.php
 */
declare(strict_types=1);

/** Decode a JSON request body, distinguishing "empty" from "malformed". */
function read_json_body(string $raw): array {
    if (trim($raw) === '') {
        return ['ok' => false, 'detail' => 'Request body was empty.'];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return ['ok' => false, 'detail' => 'Request body was not valid JSON.'];
    }
    return ['ok' => true, 'value' => $data];
}

/** Every required field must be present and non-empty. */
function require_fields(array $data, array $fields): array {
    $missing = [];
    foreach ($fields as $f) {
        if (!array_key_exists($f, $data) || $data[$f] === '' || $data[$f] === null) {
            $missing[] = $f;
        }
    }
    if ($missing) {
        return ['ok' => false, 'detail' => 'Missing required ' .
            (count($missing) === 1 ? 'field' : 'fields') . ': ' . implode(', ', $missing)];
    }
    return ['ok' => true];
}

function valid_email(string $email): bool {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false && mb_strlen($email) <= 254;
}

/** An integer within bounds — used for ids, page numbers and limits. */
function valid_int($value, int $min, int $max): bool {
    return filter_var($value, FILTER_VALIDATE_INT, ['options' => ['min_range' => $min, 'max_range' => $max]]) !== false;
}

/**
 * Password policy. Length is weighted over character classes because it is what actually resists
 * guessing, and forcing symbols mostly produces "Password1!" across an entire institution.
 */
function password_problems(string $password): array {
    $problems = [];
    if (mb_strlen($password) < 10) $problems[] = 'must be at least 10 characters';
    if (!preg_match('/[a-zA-Z]/', $password)) $problems[] = 'must include a letter';
    if (!preg_match('/\d/', $password)) $problems[] = 'must include a number';
    if (preg_match('/^(password|welcome|durham|learnify)/i', $password)) {
        $problems[] = 'is too easy to guess';
    }
    return $problems;
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    print_r(read_json_body('not json'));
    print_r(require_fields(['email' => 'a@b.ca'], ['email', 'password']));
    echo 'valid email  : ', var_export(valid_email('student@demo.learnify'), true), PHP_EOL;
    echo 'course id 5  : ', var_export(valid_int('5', 1, 1000), true), PHP_EOL;
    echo 'course id -1 : ', var_export(valid_int('-1', 1, 1000), true), PHP_EOL;
    print_r(password_problems('pass1'));
}

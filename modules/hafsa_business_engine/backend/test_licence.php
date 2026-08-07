<?php

declare(strict_types=1);

require_once __DIR__ . '/licence.php';

function assert_true(bool $condition, string $testName): void
{
    if (!$condition) {
        echo "[FAIL] {$testName}\n";
        exit(1);
    }

    echo "[PASS] {$testName}\n";
}

function assert_false(bool $condition, string $testName): void
{
    assert_true(!$condition, $testName);
}

function assert_same(mixed $expected, mixed $actual, string $testName): void
{
    if ($expected !== $actual) {
        echo "[FAIL] {$testName}\n";
        echo "Expected: " . var_export($expected, true) . "\n";
        echo "Actual:   " . var_export($actual, true) . "\n";
        exit(1);
    }

    echo "[PASS] {$testName}\n";
}

function test_missing_key_paths(): void
{
    assert_false(
        licence_key_present([]),
        'Missing TENANT_KEY is rejected'
    );

    assert_false(
        licence_key_present(['TENANT_KEY' => '']),
        'Empty TENANT_KEY is rejected'
    );

    assert_false(
        licence_key_present(['TENANT_KEY' => '   ']),
        'Whitespace-only TENANT_KEY is rejected'
    );

    assert_false(
        licence_key_present(['TENANT_KEY' => 'CHANGE_ME']),
        'Placeholder TENANT_KEY is rejected'
    );

    assert_true(
        licence_key_present(['TENANT_KEY' => 'ck_0123456789abcdef']),
        'Configured TENANT_KEY is accepted as present'
    );
}

function test_key_format_paths(): void
{
    assert_true(
        licence_key_well_formed('ck_0123456789abcdef'),
        'A 16-character lowercase hexadecimal key is accepted'
    );

    assert_true(
        licence_key_well_formed(
            'ck_0123456789abcdef0123456789abcdef'
        ),
        'A 32-character lowercase hexadecimal key is accepted'
    );

    assert_false(
        licence_key_well_formed('ck_1234'),
        'A key shorter than 16 characters is rejected'
    );

    assert_false(
        licence_key_well_formed(
            'ck_0123456789abcdef0123456789abcdef0'
        ),
        'A key longer than 32 characters is rejected'
    );

    assert_false(
        licence_key_well_formed('ck_0123456789ABCDEF'),
        'Uppercase hexadecimal characters are rejected'
    );

    assert_false(
        licence_key_well_formed('ck_0123456789abcdeg'),
        'Non-hexadecimal characters are rejected'
    );

    assert_false(
        licence_key_well_formed('0123456789abcdef'),
        'A key without the ck_ prefix is rejected'
    );

    assert_false(
        licence_key_well_formed('invalid-key'),
        'An unrelated key format is rejected'
    );
}

function test_upstream_messages(): void
{
    assert_same(
        'Licence key not recognised. Contact your provider.',
        licence_explain(401),
        'Upstream 401 is translated'
    );

    assert_same(
        'This licence has been suspended or has expired.',
        licence_explain(403),
        'Upstream 403 is translated'
    );

    assert_same(
        'The service is locked pending activation by an administrator.',
        licence_explain(503),
        'Upstream 503 is translated'
    );

    assert_same(
        null,
        licence_explain(500),
        'Unknown status returns no licence-specific message'
    );
}

function run_tests(): void
{
    echo "Running licence tests...\n\n";

    test_missing_key_paths();
    test_key_format_paths();
    test_upstream_messages();

    echo "\nAll licence tests passed.\n";
}

run_tests();
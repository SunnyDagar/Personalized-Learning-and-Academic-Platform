<?php
/**
 * Portal navigation manifest — portals (slides 10–12).
 *
 * The student and professor portals share one shell and differ by what appears in the sidebar.
 * Keeping that list in one place stops the two portals drifting apart as features are added.
 * Hiding an item is presentation only — the API still authorises every request independently.
 * Self-contained and runnable:  php nav_manifest.php
 */
declare(strict_types=1);

/** Every destination either portal can show, with the roles allowed to see it. */
function nav_items(): array {
    return [
        ['id' => 'overview',    'label' => 'Overview',    'icon' => 'home',   'roles' => ['student', 'professor']],
        ['id' => 'courses',     'label' => 'My Courses',  'icon' => 'book',   'roles' => ['student', 'professor']],
        ['id' => 'assistant',   'label' => 'Study Help',  'icon' => 'chat',   'roles' => ['student']],
        ['id' => 'flashcards',  'label' => 'Flashcards',  'icon' => 'cards',  'roles' => ['student']],
        ['id' => 'progress',    'label' => 'My Progress', 'icon' => 'chart',  'roles' => ['student']],
        ['id' => 'materials',   'label' => 'Materials',   'icon' => 'folder', 'roles' => ['professor']],
        ['id' => 'assessments', 'label' => 'Assessments', 'icon' => 'check',  'roles' => ['professor']],
        ['id' => 'class',       'label' => 'Class Insights', 'icon' => 'users', 'roles' => ['professor']],
        ['id' => 'appointments','label' => 'Appointments','icon' => 'clock',  'roles' => ['student', 'professor']],
    ];
}

/** The sidebar for one role. */
function nav_for_role(string $role): array {
    $role = strtolower($role);
    return array_values(array_filter(
        nav_items(),
        static fn(array $i): bool => in_array($role, $i['roles'], true)
    ));
}

/** Is a destination one this role is meant to reach? Used to pick a sensible landing page. */
function nav_allows(string $role, string $id): bool {
    foreach (nav_for_role($role) as $item) {
        if ($item['id'] === $id) return true;
    }
    return false;
}

/** Where to send someone who signs in without a specific destination. */
function nav_default(string $role): string {
    $first = nav_for_role($role)[0]['id'] ?? 'overview';
    return $first;
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    foreach (['student', 'professor'] as $role) {
        $labels = array_column(nav_for_role($role), 'label');
        printf("%-10s (%d items): %s%s", $role, count($labels), implode(' · ', $labels), PHP_EOL);
    }
    echo PHP_EOL;
    var_dump(nav_allows('student', 'assessments'));   // false — professor-only
    var_dump(nav_allows('professor', 'assessments')); // true
}

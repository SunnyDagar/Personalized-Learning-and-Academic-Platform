<?php
/**
 * Licence state machine — business engine (slides 17–end).
 *
 * A licence is not simply on or off. It can be trialling, active, near renewal, lapsed or
 * suspended, and each state needs its own message and its own consequence. Naming them here means
 * the UI, the docs and the sales conversation all use the same words.
 *
 * The authority is the hosted API: it decides on every request whether a key is still good. This
 * mirrors those states so the interface can warn ahead of time rather than only after a refusal.
 * Self-contained and runnable:  php licence_state.php
 */
declare(strict_types=1);

const RENEWAL_WARNING_DAYS = 30;

/**
 * Work out the state of a licence from its record.
 * $licence: ['active' => bool, 'expires_at' => 'YYYY-MM-DD HH:MM:SS'|null, 'trial' => bool]
 */
function licence_state(array $licence, ?int $now = null): array {
    $now       = $now ?? time();
    $expiresAt = !empty($licence['expires_at']) ? strtotime((string)$licence['expires_at']) : null;
    $daysLeft  = $expiresAt !== null ? (int)floor(($expiresAt - $now) / 86400) : null;

    if (empty($licence['active'])) {
        return state('suspended', 'Licence suspended',
            'This institution’s licence has been suspended. Please contact your provider.', $daysLeft, false);
    }
    if ($expiresAt !== null && $expiresAt < $now) {
        return state('expired', 'Licence expired',
            'This licence lapsed on ' . date('j F Y', $expiresAt) . '. Please renew to continue.', $daysLeft, false);
    }
    if (!empty($licence['trial'])) {
        return state('trial', 'Trial',
            $daysLeft === null ? 'Trial in progress.' : "Trial ends in {$daysLeft} days.", $daysLeft, true);
    }
    if ($daysLeft !== null && $daysLeft <= RENEWAL_WARNING_DAYS) {
        return state('renewal_due', 'Renewal due',
            "This licence expires in {$daysLeft} days.", $daysLeft, true);
    }
    return state('active', 'Active', 'Licence is active.', $daysLeft, true);
}

function state(string $key, string $label, string $message, ?int $daysLeft, bool $usable): array {
    return [
        'state'      => $key,
        'label'      => $label,
        'message'    => $message,
        'days_left'  => $daysLeft,
        'usable'     => $usable,
        'severity'   => $usable ? ($key === 'active' ? 'info' : 'warning') : 'blocking',
    ];
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $cases = [
        'healthy'      => ['active' => true,  'expires_at' => '2027-01-01 00:00:00'],
        'evaluation'   => ['active' => true,  'expires_at' => '2026-09-30 23:59:59'],
        'lapsed'       => ['active' => true,  'expires_at' => '2026-01-01 00:00:00'],
        'suspended'    => ['active' => false, 'expires_at' => '2027-01-01 00:00:00'],
        'trial'        => ['active' => true,  'expires_at' => '2026-08-20 00:00:00', 'trial' => true],
    ];
    foreach ($cases as $name => $lic) {
        $s = licence_state($lic);
        printf("%-12s %-12s usable=%-5s  %s%s", $name, $s['state'],
               var_export($s['usable'], true), $s['message'], PHP_EOL);
    }
}

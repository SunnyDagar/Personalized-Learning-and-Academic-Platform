<?php
/**
 * Edge configuration for the evaluation deployment.
 *
 * This ships with a time-limited evaluation licence so the software can be cloned and run
 * without any setup. The licence is enforced on the hosted API: it can be suspended at any
 * time and lapses automatically on 30 September 2026, after which this client software
 * stops working. It grants access to the service — it does not disclose any server-side code.
 *
 * A production deployment copies this to config.php (git-ignored) with its own tenant key.
 */
return [
    // The licensed API this deployment talks to.
    'API_BASE'   => 'https://dagarretail.com',

    // Tenant licence key, issued per institution. Revocable at any time, and enforced
    // server-side: this evaluation licence stops working after 30 September 2026.
    'TENANT_KEY' => 'ck_3c55e5cc28991d29b7c26d80',   // Durham College - Evaluation, expires 2026-09-30

    // Abuse throttle only — requests per minute per client. Raise or set 0 to disable.
    // This is NOT an IP allow-list; no address is ever blocked from using the software.
    'RATE_LIMIT_PER_MIN' => 60,
];

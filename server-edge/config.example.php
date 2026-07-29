<?php
/**
 * Edge configuration template. Copy to config.php and fill in.
 * config.php is git-ignored — never commit a real tenant key.
 */
return [
    // The licensed API this deployment talks to.
    'API_BASE'   => 'https://dagarretail.com',

    // Tenant licence key, issued per institution. Revocable at any time.
    'TENANT_KEY' => 'CHANGE_ME',

    // Abuse throttle only — requests per minute per client. Raise or set 0 to disable.
    // This is NOT an IP allow-list; no address is ever blocked from using the software.
    'RATE_LIMIT_PER_MIN' => 60,
];

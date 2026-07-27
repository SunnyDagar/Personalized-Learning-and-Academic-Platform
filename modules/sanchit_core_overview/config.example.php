<?php
/** Foundational config template (copy to config.php / .env on the server — never commit real values). */
return [
    'DB_HOST'   => '127.0.0.1',
    'DB_NAME'   => 'equitypulse',
    'DB_USER'   => 'CHANGE_ME',
    'DB_PASS'   => 'CHANGE_ME',
    // AI
    'GEMINI_MODEL'       => 'gemini-2.5-flash',
    'GEMINI_EMBED_MODEL' => 'gemini-embedding-001',
    'GEMINI_API_KEY'     => 'CHANGE_ME',        // stored AES-encrypted in DB in production
    // SaaS activation gate
    'ACTIVATION_SECRET'  => 'CHANGE_ME',
];

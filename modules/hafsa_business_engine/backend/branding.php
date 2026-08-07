<?php
/**
 * White-label branding — business engine (slides 17–end).
 *
 * Institutions expect the platform to look like theirs. Branding is the cheapest lever we have for
 * that, and it is a paid tier, so it belongs in the business module rather than being scattered
 * through the UI.
 *
 * Every value is validated before it reaches a template: a colour that is not a colour, or a logo
 * URL pointing at an arbitrary host, would otherwise be injected straight into the page.
 * Self-contained and runnable:  php branding.php
 */
declare(strict_types=1);

function brand_defaults(): array {
    return [
        'name'         => 'Learnify',
        'primary'      => '#0052cc',
        'accent'       => '#36b37e',
        'logo_url'     => '',
        'support_email'=> '',
        'footer_note'  => '',
    ];
}

/** #rgb or #rrggbb only — anything else is rejected rather than sanitised. */
function is_hex_colour(string $value): bool {
    return (bool)preg_match('/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $value);
}

/** https only, so branding cannot downgrade a page to mixed content. */
function is_safe_logo_url(string $url): bool {
    if ($url === '') return true;
    $parts = parse_url($url);
    return ($parts['scheme'] ?? '') === 'https' && !empty($parts['host']);
}

/** Merge a customer's overrides onto the defaults, discarding anything invalid. */
function brand_resolve(array $overrides): array {
    $brand = brand_defaults();

    if (!empty($overrides['name']) && is_string($overrides['name'])) {
        $brand['name'] = mb_substr(trim($overrides['name']), 0, 60);
    }
    foreach (['primary', 'accent'] as $key) {
        if (!empty($overrides[$key]) && is_hex_colour((string)$overrides[$key])) {
            $brand[$key] = strtolower((string)$overrides[$key]);
        }
    }
    if (isset($overrides['logo_url']) && is_safe_logo_url((string)$overrides['logo_url'])) {
        $brand['logo_url'] = (string)$overrides['logo_url'];
    }
    if (!empty($overrides['support_email'])
        && filter_var($overrides['support_email'], FILTER_VALIDATE_EMAIL)) {
        $brand['support_email'] = (string)$overrides['support_email'];
    }
    if (!empty($overrides['footer_note'])) {
        $brand['footer_note'] = mb_substr(strip_tags((string)$overrides['footer_note']), 0, 200);
    }
    return $brand;
}

/** CSS custom properties for the shell. Values are already validated above. */
function brand_css_vars(array $brand): string {
    return sprintf(':root{--brand-primary:%s;--brand-accent:%s;}', $brand['primary'], $brand['accent']);
}

if (PHP_SAPI === 'cli' && realpath($argv[0] ?? '') === realpath(__FILE__)) {
    $brand = brand_resolve([
        'name'     => 'Durham College',
        'primary'  => '#7a1f2b',
        'accent'   => 'javascript:alert(1)',            // rejected, falls back to default
        'logo_url' => 'http://insecure.example.com/l.png', // rejected, not https
        'footer_note' => '<script>bad()</script>Approved provider',
    ]);
    print_r($brand);
    echo brand_css_vars($brand), PHP_EOL;
}

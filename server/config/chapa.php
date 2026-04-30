<?php

declare(strict_types=1);

use Yishaq\Server\Core\Env;

return [
    'enabled' => Env::bool('CHAPA_ENABLED', true),
    'base_url' => Env::string('CHAPA_BASE_URL', 'https://api.chapa.co'),
    'secret_key' => Env::string('CHAPA_SECRET_KEY', Env::string('PAYMENT_SECRET_KEY', '')),
    'public_key' => Env::string('CHAPA_PUBLIC_KEY', Env::string('PAYMENT_PUBLIC_KEY', '')),
    'encryption_key' => Env::string('CHAPA_ENCRYPTION_KEY', ''),
    'webhook_url' => Env::string('CHAPA_WEBHOOK_URL', ''),
    'webhook_secret' => Env::string('PAYMENT_WEBHOOK_SECRET', ''),
    'currency' => Env::string('CHAPA_CURRENCY', 'ETB'),
    'timeout_seconds' => Env::int('CHAPA_TIMEOUT_SECONDS', 30),
];

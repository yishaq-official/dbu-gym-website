<?php

declare(strict_types=1);

use Yishaq\Server\Core\Env;

return [
    'token' => [
        'ttl_seconds' => Env::int('AUTH_TOKEN_TTL', 604800),
        'issuer' => Env::string('AUTH_TOKEN_ISSUER', 'dbugym-api'),
        'secret' => Env::string('AUTH_TOKEN_SECRET', 'change-me-in-production'),
    ],
    'password' => [
        'min_length' => Env::int('AUTH_PASSWORD_MIN_LENGTH', 8),
    ],
];

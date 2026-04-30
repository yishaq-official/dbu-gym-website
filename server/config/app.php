<?php

declare(strict_types=1);

use Yishaq\Server\Core\Env;

return [
    'name' => Env::string('APP_NAME', 'dbugym API'),
    'env' => Env::string('APP_ENV', 'local'),
    'debug' => Env::bool('APP_DEBUG', true),
    'timezone' => Env::string('APP_TIMEZONE', 'Africa/Addis_Ababa'),
    'url' => Env::string('APP_URL', 'http://localhost:8000'),
];

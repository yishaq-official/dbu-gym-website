<?php

declare(strict_types=1);

use Yishaq\Server\Core\Env;

return [
    'driver' => Env::string('MAIL_DRIVER', 'smtp'),
    'host' => Env::string('MAIL_HOST', 'smtp.gmail.com'),
    'port' => Env::int('MAIL_PORT', 465),
    'encryption' => Env::string('MAIL_ENCRYPTION', 'ssl'),
    'username' => Env::string('MAIL_USERNAME', Env::string('ORGANIZATION_EMAIL', '')),
    'password' => Env::string('MAIL_PASSWORD', Env::string('APP_PASSWORD', '')),
    'from' => [
        'address' => Env::string('MAIL_FROM_ADDRESS', Env::string('ORGANIZATION_EMAIL', '')),
        'name' => Env::string('MAIL_FROM_NAME', 'Gym Support'),
    ],
];

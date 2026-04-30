<?php

declare(strict_types=1);

use Yishaq\Server\Core\Env;

return [
    'default' => Env::string('DB_CONNECTION', 'mysql'),
    'connections' => [
        'mysql' => [
            'driver' => 'mysql',
            'host' => Env::string('DB_HOST', '127.0.0.1'),
            'port' => Env::int('DB_PORT', 3306),
            'database' => Env::string('DB_DATABASE', 'dbugym'),
            'username' => Env::string('DB_USERNAME', 'root'),
            'password' => Env::string('DB_PASSWORD', ''),
            'charset' => Env::string('DB_CHARSET', 'utf8mb4'),
            'collation' => Env::string('DB_COLLATION', 'utf8mb4_unicode_ci'),
        ],
    ],
];

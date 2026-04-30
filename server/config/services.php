<?php

declare(strict_types=1);

use Yishaq\Server\Core\Env;

return [
    'frontend_url' => Env::string('FRONTEND_URL', 'http://localhost:5173'),
    'uploads' => [
        'avatars_dir' => Env::string('UPLOADS_AVATARS_DIR', 'storage/uploads/avatars'),
        'logos_dir' => Env::string('UPLOADS_LOGOS_DIR', 'storage/uploads/logos'),
    ],
    'csv' => [
        'delimiter' => Env::string('CSV_DELIMITER', ','),
        'enclosure' => Env::string('CSV_ENCLOSURE', '"'),
    ],
];

<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Config;
use Yishaq\Server\Database;

abstract class BaseService
{
    protected function db(): Database
    {
        return AppContext::database();
    }

    protected function config(): Config
    {
        return AppContext::config();
    }
}

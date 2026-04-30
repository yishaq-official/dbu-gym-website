<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Database;

abstract class BaseModel
{
    protected Database $db;

    public function __construct(?Database $db = null)
    {
        $this->db = $db ?? AppContext::database();
    }

    abstract protected function table(): string;
}

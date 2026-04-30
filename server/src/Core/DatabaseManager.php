<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

use RuntimeException;
use Yishaq\Server\Database;

final class DatabaseManager
{
    private Config $config;

    /**
     * @var array<string, Database>
     */
    private array $connections = [];

    public function __construct(Config $config)
    {
        $this->config = $config;
    }

    public function defaultConnectionName(): string
    {
        return $this->config->requireString('database.default');
    }

    public function connection(?string $name = null): Database
    {
        $connectionName = $name ?? $this->defaultConnectionName();

        if (isset($this->connections[$connectionName])) {
            return $this->connections[$connectionName];
        }

        $settings = $this->config->requireArray('database.connections.' . $connectionName);
        if ($settings === []) {
            throw new RuntimeException('Database connection settings are empty for: ' . $connectionName);
        }

        $database = new Database($settings);
        $this->connections[$connectionName] = $database;

        return $database;
    }

    /**
     * @return array<string>
     */
    public function connectionNames(): array
    {
        $connections = $this->config->requireArray('database.connections');
        return array_keys($connections);
    }

    public function hasConnection(string $name): bool
    {
        $connections = $this->config->requireArray('database.connections');
        return array_key_exists($name, $connections);
    }

    public function ping(?string $name = null): bool
    {
        return $this->connection($name)->ping();
    }
}

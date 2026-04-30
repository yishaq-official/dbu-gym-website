<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

use RuntimeException;
use Yishaq\Server\Database;

final class AppContext
{
    private static ?Config $config = null;
    private static ?Database $database = null;
    private static ?Container $container = null;

    public static function setConfig(Config $config): void
    {
        self::$config = $config;
    }

    public static function config(): Config
    {
        if (!self::$config instanceof Config) {
            throw new RuntimeException('Config has not been initialized.');
        }

        return self::$config;
    }

    public static function setDatabase(Database $database): void
    {
        self::$database = $database;
    }

    public static function database(): Database
    {
        if (!self::$database instanceof Database) {
            throw new RuntimeException('Database has not been initialized.');
        }

        return self::$database;
    }

    public static function setContainer(Container $container): void
    {
        self::$container = $container;
    }

    public static function container(): Container
    {
        if (!self::$container instanceof Container) {
            throw new RuntimeException('Container has not been initialized.');
        }

        return self::$container;
    }
}

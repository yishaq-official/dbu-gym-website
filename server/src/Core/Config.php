<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

use Yishaq\Server\Core\Exceptions\ConfigException;

final class Config
{
    private array $items = [];

    public function __construct(string $configPath)
    {
        if (!is_dir($configPath)) {
            throw new ConfigException('Config directory not found: ' . $configPath);
        }

        $files = glob(rtrim($configPath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '*.php');
        if ($files === false) {
            return;
        }

        foreach ($files as $file) {
            $key = basename($file, '.php');
            $value = require $file;

            if (!is_array($value)) {
                throw new ConfigException('Config file must return array: ' . $file);
            }

            $this->items[$key] = $value;
        }
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $resolved = $this->resolve($key);
        return $resolved['found'] ? $resolved['value'] : $default;
    }

    public function require(string $key): mixed
    {
        $resolved = $this->resolve($key);
        if (!$resolved['found']) {
            throw new ConfigException('Required config key is missing: ' . $key);
        }

        return $resolved['value'];
    }

    public function getString(string $key, string $default = ''): string
    {
        $value = $this->get($key, $default);
        return is_string($value) ? $value : $default;
    }

    public function requireString(string $key): string
    {
        $value = $this->require($key);
        if (!is_string($value)) {
            throw new ConfigException('Config key must be string: ' . $key);
        }

        return $value;
    }

    public function getInt(string $key, int $default = 0): int
    {
        $value = $this->get($key, $default);

        if (is_int($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        return $default;
    }

    public function requireInt(string $key): int
    {
        $value = $this->require($key);

        if (is_int($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        throw new ConfigException('Config key must be int-like: ' . $key);
    }

    public function getBool(string $key, bool $default = false): bool
    {
        $value = $this->get($key, $default);

        if (is_bool($value)) {
            return $value;
        }

        if (is_string($value)) {
            $normalized = strtolower(trim($value));
            if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
                return true;
            }
            if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
                return false;
            }
        }

        if (is_int($value)) {
            return $value === 1;
        }

        return $default;
    }

    public function requireBool(string $key): bool
    {
        $resolved = $this->resolve($key);
        if (!$resolved['found']) {
            throw new ConfigException('Required config key is missing: ' . $key);
        }

        $value = $this->getBool($key, false);

        $raw = $resolved['value'];
        $rawIsBoolLike =
            is_bool($raw)
            || is_int($raw)
            || (is_string($raw) && in_array(strtolower(trim($raw)), ['1', '0', 'true', 'false', 'yes', 'no', 'on', 'off'], true));

        if (!$rawIsBoolLike) {
            throw new ConfigException('Config key must be bool-like: ' . $key);
        }

        return $value;
    }

    public function getArray(string $key, array $default = []): array
    {
        $value = $this->get($key, $default);
        return is_array($value) ? $value : $default;
    }

    public function requireArray(string $key): array
    {
        $value = $this->require($key);
        if (!is_array($value)) {
            throw new ConfigException('Config key must be array: ' . $key);
        }

        return $value;
    }

    public function all(): array
    {
        return $this->items;
    }

    /**
     * @return array{found: bool, value: mixed}
     */
    private function resolve(string $key): array
    {
        $segments = explode('.', $key);
        $value = $this->items;

        foreach ($segments as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return ['found' => false, 'value' => null];
            }
            $value = $value[$segment];
        }

        return ['found' => true, 'value' => $value];
    }
}

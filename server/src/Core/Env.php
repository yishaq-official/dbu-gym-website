<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

final class Env
{
    public static function load(string $basePath, string $fileName = '.env'): void
    {
        $path = rtrim($basePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . ltrim($fileName, DIRECTORY_SEPARATOR);
        if (!is_file($path) || !is_readable($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $trimmed = trim((string) $line);
            if ($trimmed === '' || str_starts_with($trimmed, '#')) {
                continue;
            }

            if (str_starts_with($trimmed, 'export ')) {
                $trimmed = trim(substr($trimmed, 7));
            }

            if (!str_contains($trimmed, '=')) {
                continue;
            }

            [$key, $rawValue] = explode('=', $trimmed, 2);
            $key = trim($key);

            if ($key === '') {
                continue;
            }

            $value = self::sanitizeValue($rawValue);

            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
            putenv($key . '=' . $value);
        }
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $value = self::read($key);

        if ($value === null || $value === '') {
            return $default;
        }

        return $value;
    }

    public static function string(string $key, string $default = ''): string
    {
        $value = self::read($key);
        return ($value === null || $value === '') ? $default : (string) $value;
    }

    public static function int(string $key, int $default = 0): int
    {
        $value = self::read($key);
        if ($value === null || $value === '') {
            return $default;
        }

        $int = filter_var($value, FILTER_VALIDATE_INT);
        return $int === false ? $default : (int) $int;
    }

    public static function bool(string $key, bool $default = false): bool
    {
        $value = self::read($key);
        if ($value === null || $value === '') {
            return $default;
        }

        $normalized = strtolower(trim((string) $value));
        if (in_array($normalized, ['1', 'true', 'yes', 'on'], true)) {
            return true;
        }
        if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
            return false;
        }

        return $default;
    }

    private static function read(string $key): ?string
    {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

        if ($value === false || $value === null) {
            return null;
        }

        return (string) $value;
    }

    private static function sanitizeValue(string $value): string
    {
        $value = trim($value);

        if ($value === '') {
            return '';
        }

        $length = strlen($value);
        $first = $value[0];
        $last = $value[$length - 1];

        $isQuoted = ($first === '"' && $last === '"') || ($first === "'" && $last === "'");

        if ($isQuoted) {
            $inner = substr($value, 1, -1);
            return str_replace(['\\"', "\\'", '\\\\'], ['"', "'", '\\'], $inner);
        }

        // Strip inline comments for unquoted values: VAR=value # comment
        $hashPos = strpos($value, ' #');
        if ($hashPos !== false) {
            $value = rtrim(substr($value, 0, $hashPos));
        }

        return $value;
    }
}

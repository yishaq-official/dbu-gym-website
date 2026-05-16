<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Exceptions\HttpException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Database;

final class RateLimiterService
{
    private static bool $tableReady = false;
    private Database $db;

    public function __construct(?Database $db = null)
    {
        $this->db = $db ?? AppContext::database();
    }

    public function hit(
        string $action,
        Request $request,
        int $maxAttempts,
        int $decaySeconds,
        ?string $subject = null
    ): void {
        $now = time();
        $window = intdiv($now, $decaySeconds);
        $identifier = implode('|', [
            $action,
            $request->ip(),
            strtolower(trim((string) $subject)),
            (string) $window,
        ]);
        $keyHash = hash('sha256', $identifier);
        $windowStart = date('Y-m-d H:i:s', $window * $decaySeconds);
        $expiresAt = date('Y-m-d H:i:s', (($window + 1) * $decaySeconds) + 60);

        $this->ensureTable();
        $this->cleanupExpired();

        $this->db->statement(
            "INSERT INTO rate_limits (`key_hash`, `action`, `identifier`, `window_start`, `attempts`, `expires_at`, `created_at`, `updated_at`)
             VALUES (:key_hash, :action, :identifier, :window_start, 1, :expires_at, NOW(), NOW())
             ON DUPLICATE KEY UPDATE attempts = attempts + 1, updated_at = NOW()",
            [
                'key_hash' => $keyHash,
                'action' => $action,
                'identifier' => hash('sha256', $request->ip() . '|' . strtolower(trim((string) $subject))),
                'window_start' => $windowStart,
                'expires_at' => $expiresAt,
            ]
        );

        $row = $this->db->first(
            "SELECT attempts FROM rate_limits WHERE key_hash = :key_hash LIMIT 1",
            ['key_hash' => $keyHash]
        );
        $attempts = (int) ($row['attempts'] ?? 0);
        if ($attempts <= $maxAttempts) {
            return;
        }

        $retryAfter = max(1, (($window + 1) * $decaySeconds) - $now);
        throw new HttpException(
            'Too many attempts. Please try again in ' . $this->formatRetryAfter($retryAfter) . '.',
            429,
            ['retry_after_seconds' => $retryAfter]
        );
    }

    private function cleanupExpired(): void
    {
        if (random_int(1, 100) !== 1) {
            return;
        }

        $this->db->statement("DELETE FROM rate_limits WHERE expires_at < NOW()");
    }

    private function ensureTable(): void
    {
        if (self::$tableReady) {
            return;
        }

        $this->db->statement(
            "CREATE TABLE IF NOT EXISTS rate_limits (
                key_hash CHAR(64) NOT NULL,
                action VARCHAR(80) NOT NULL,
                identifier CHAR(64) NOT NULL,
                window_start TIMESTAMP NOT NULL,
                attempts INT UNSIGNED NOT NULL DEFAULT 0,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (key_hash),
                KEY rate_limits_action_identifier_index (action, identifier),
                KEY rate_limits_expires_at_index (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );

        self::$tableReady = true;
    }

    private function formatRetryAfter(int $seconds): string
    {
        if ($seconds < 60) {
            return $seconds . ' second' . ($seconds === 1 ? '' : 's');
        }

        $minutes = (int) ceil($seconds / 60);
        return $minutes . ' minute' . ($minutes === 1 ? '' : 's');
    }
}

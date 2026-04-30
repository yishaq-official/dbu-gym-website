<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class AuthTokenSession extends BaseModel
{
    protected function table(): string
    {
        return 'sessions';
    }

    public function createTokenSession(
        string $id,
        int $userId,
        array $payload,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): void {
        $this->db->statement(
            "INSERT INTO {$this->table()} (id, user_id, ip_address, user_agent, payload, last_activity)
             VALUES (:id, :user_id, :ip_address, :user_agent, :payload, :last_activity)",
            [
                'id' => $id,
                'user_id' => $userId,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'payload' => json_encode($payload, JSON_UNESCAPED_SLASHES),
                'last_activity' => time(),
            ]
        );
    }

    public function findActive(string $id): ?array
    {
        $session = $this->db->first(
            "SELECT * FROM {$this->table()} WHERE id = :id LIMIT 1",
            ['id' => $id]
        );

        if (!$session) {
            return null;
        }

        $payload = json_decode((string) ($session['payload'] ?? ''), true);
        if (!is_array($payload) || !empty($payload['revoked_at'])) {
            return null;
        }

        if ((int) ($payload['exp'] ?? 0) > 0 && (int) $payload['exp'] < time()) {
            return null;
        }

        return $session;
    }

    public function revoke(string $id): void
    {
        $session = $this->db->first(
            "SELECT payload FROM {$this->table()} WHERE id = :id LIMIT 1",
            ['id' => $id]
        );

        if (!$session) {
            return;
        }

        $payload = json_decode((string) ($session['payload'] ?? ''), true);
        $payload = is_array($payload) ? $payload : [];
        $payload['revoked_at'] = date(DATE_ATOM);

        $this->db->statement(
            "UPDATE {$this->table()}
             SET payload = :payload, last_activity = :last_activity
             WHERE id = :id",
            [
                'id' => $id,
                'payload' => json_encode($payload, JSON_UNESCAPED_SLASHES),
                'last_activity' => time(),
            ]
        );
    }
}

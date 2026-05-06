<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class Notification extends BaseModel
{
    protected function table(): string
    {
        return 'notifications';
    }

    public function create(array $payload): int
    {
        $this->db->statement(
            "INSERT INTO {$this->table()} (user_id, content, type, sent_datetime, created_at, updated_at)
             VALUES (:user_id, :content, :type, :sent_datetime, NOW(), NOW())",
            [
                'user_id' => $payload['user_id'] ?? null,
                'content' => $payload['content'],
                'type' => $payload['type'],
                'sent_datetime' => $payload['sent_datetime'] ?? date('Y-m-d H:i:s'),
            ]
        );

        return (int) $this->db->pdo()->lastInsertId();
    }

    public function latestByUserId(int $userId, int $limit = 10): array
    {
        $limit = max(1, min(100, $limit));
        return $this->db->select(
            "SELECT id, user_id, content, type, sent_datetime
             FROM {$this->table()}
             WHERE user_id = :user_id
             ORDER BY sent_datetime DESC, id DESC
             LIMIT {$limit}",
            ['user_id' => $userId]
        );
    }

    public function existsRecentByType(int $userId, string $type, int $withinHours = 24): bool
    {
        $withinHours = max(1, min(24 * 30, $withinHours));

        $row = $this->db->first(
            "SELECT id
             FROM {$this->table()}
             WHERE user_id = :user_id
               AND type = :type
               AND sent_datetime >= DATE_SUB(NOW(), INTERVAL {$withinHours} HOUR)
             ORDER BY sent_datetime DESC, id DESC
             LIMIT 1",
            [
                'user_id' => $userId,
                'type' => $type,
            ]
        );

        return is_array($row) && !empty($row);
    }
}


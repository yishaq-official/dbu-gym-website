<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class AuditLog extends BaseModel
{
    protected function table(): string
    {
        return 'audit_logs';
    }

    public function create(array $payload): int
    {
        $this->db->statement(
            "INSERT INTO {$this->table()} (
                user_id, action, details, ip_address, user_agent, created_at
            ) VALUES (
                :user_id, :action, :details, :ip_address, :user_agent, NOW()
            )",
            [
                'user_id' => $payload['user_id'] ?? null,
                'action' => $payload['action'],
                'details' => isset($payload['details']) ? json_encode($payload['details'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
                'ip_address' => $payload['ip_address'] ?? null,
                'user_agent' => $payload['user_agent'] ?? null,
            ]
        );

        return (int) $this->db->pdo()->lastInsertId();
    }
}
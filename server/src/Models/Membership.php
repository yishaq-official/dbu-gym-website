<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class Membership extends BaseModel
{
    protected function table(): string
    {
        return 'memberships';
    }

    public function findById(int $id): ?array
    {
        return $this->db->first(
            "SELECT * FROM {$this->table()} WHERE id = :id LIMIT 1",
            ['id' => $id]
        );
    }

    public function findLatestByUserId(int $userId): ?array
    {
        return $this->db->first(
            "SELECT * FROM {$this->table()} WHERE user_id = :user_id ORDER BY id DESC LIMIT 1",
            ['user_id' => $userId]
        );
    }

    public function create(array $payload): int
    {
        $this->db->statement(
            "INSERT INTO {$this->table()} (
                user_id, membership_type, plan_cost, currency, membership_status, payment_status,
                plan_start_at, plan_expires_at, created_at, updated_at
            ) VALUES (
                :user_id, :membership_type, :plan_cost, :currency, :membership_status, :payment_status,
                :plan_start_at, :plan_expires_at, NOW(), NOW()
            )",
            [
                'user_id' => $payload['user_id'],
                'membership_type' => $payload['membership_type'],
                'plan_cost' => $payload['plan_cost'],
                'currency' => $payload['currency'] ?? 'ETB',
                'membership_status' => $payload['membership_status'] ?? 'pending',
                'payment_status' => $payload['payment_status'] ?? 'pending',
                'plan_start_at' => $payload['plan_start_at'] ?? null,
                'plan_expires_at' => $payload['plan_expires_at'] ?? null,
            ]
        );

        return (int) $this->db->pdo()->lastInsertId();
    }

    public function markPaymentPaid(int $id, string $startAt, string $expiresAt): int
    {
        return $this->db->statement(
            "UPDATE {$this->table()}
             SET payment_status = 'paid',
                 plan_start_at = :plan_start_at,
                 plan_expires_at = :plan_expires_at,
                 updated_at = NOW()
             WHERE id = :id",
            [
                'id' => $id,
                'plan_start_at' => $startAt,
                'plan_expires_at' => $expiresAt,
            ]
        );
    }

    public function markPaymentFailed(int $id): int
    {
        return $this->db->statement(
            "UPDATE {$this->table()}
             SET payment_status = 'failed', updated_at = NOW()
             WHERE id = :id",
            ['id' => $id]
        );
    }
}

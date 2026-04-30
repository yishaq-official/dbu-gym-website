<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class MemberProfile extends BaseModel
{
    protected function table(): string
    {
        return 'member_profiles';
    }

    public function findByUserId(int $userId): ?array
    {
        return $this->db->first(
            "SELECT * FROM {$this->table()} WHERE user_id = :user_id LIMIT 1",
            ['user_id' => $userId]
        );
    }

    public function create(array $payload): int
    {
        $this->db->statement(
            "INSERT INTO {$this->table()} (
                user_id, member_id, member_type, gender, membership_type, university_id, department, national_id, address,
                terms_accepted_at, created_at, updated_at
            ) VALUES (
                :user_id, :member_id, :member_type, :gender, :membership_type, :university_id, :department, :national_id, :address,
                :terms_accepted_at, NOW(), NOW()
            )",
            [
                'user_id' => $payload['user_id'],
                'member_id' => $payload['member_id'],
                'member_type' => $payload['member_type'],
                'gender' => $payload['gender'] ?? null,
                'membership_type' => $payload['membership_type'] ?? null,
                'university_id' => $payload['university_id'] ?? null,
                'department' => $payload['department'] ?? null,
                'national_id' => $payload['national_id'] ?? null,
                'address' => $payload['address'] ?? null,
                'terms_accepted_at' => $payload['terms_accepted_at'] ?? null,
            ]
        );

        return (int) $this->db->pdo()->lastInsertId();
    }
}

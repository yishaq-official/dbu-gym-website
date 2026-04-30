<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class PasswordResetToken extends BaseModel
{
    protected function table(): string
    {
        return 'password_reset_tokens';
    }

    public function store(string $email, string $hashedToken): void
    {
        $this->db->statement(
            "REPLACE INTO {$this->table()} (email, token, created_at)
             VALUES (:email, :token, NOW())",
            [
                'email' => $email,
                'token' => $hashedToken,
            ]
        );
    }

    public function findByEmail(string $email): ?array
    {
        return $this->db->first(
            "SELECT * FROM {$this->table()} WHERE email = :email LIMIT 1",
            ['email' => $email]
        );
    }

    public function deleteByEmail(string $email): void
    {
        $this->db->statement(
            "DELETE FROM {$this->table()} WHERE email = :email",
            ['email' => $email]
        );
    }
}

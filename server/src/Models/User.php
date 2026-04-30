<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class User extends BaseModel
{
    protected function table(): string
    {
        return 'users';
    }

    public function findById(int $id): ?array
    {
        return $this->db->first(
            "SELECT * FROM {$this->table()} WHERE id = :id LIMIT 1",
            ['id' => $id]
        );
    }

    public function findByEmail(string $email): ?array
    {
        return $this->db->first(
            "SELECT * FROM {$this->table()} WHERE email = :email LIMIT 1",
            ['email' => $email]
        );
    }

    public function create(array $payload): int
    {
        $this->db->statement(
            "INSERT INTO {$this->table()} (name, username, email, phone, password, role, account_status, created_at, updated_at)
             VALUES (:name, :username, :email, :phone, :password, :role, :account_status, NOW(), NOW())",
            [
                'name' => $payload['name'],
                'username' => $payload['username'] ?? null,
                'email' => $payload['email'],
                'phone' => $payload['phone'] ?? '',
                'password' => $payload['password'],
                'role' => $payload['role'] ?? 'member',
                'account_status' => $payload['account_status'] ?? 'pending_approval',
            ]
        );

        return (int) $this->db->pdo()->lastInsertId();
    }

    public function updateById(int $id, array $attributes): int
    {
        if ($attributes === []) {
            return 0;
        }

        $setClauses = [];
        $bindings = ['id' => $id];

        foreach ($attributes as $column => $value) {
            $setClauses[] = "{$column} = :{$column}";
            $bindings[$column] = $value;
        }

        $setSql = implode(', ', $setClauses);

        return $this->db->statement(
            "UPDATE {$this->table()} SET {$setSql}, updated_at = NOW() WHERE id = :id",
            $bindings
        );
    }
}

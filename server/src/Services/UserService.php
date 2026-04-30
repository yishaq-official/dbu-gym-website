<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Models\User;

final class UserService
{
    public function __construct(private readonly User $users = new User())
    {
    }

    public function findById(int $id): ?array
    {
        return $this->users->findById($id);
    }

    public function findByEmail(string $email): ?array
    {
        return $this->users->findByEmail($email);
    }

    public function createMember(array $payload): array
    {
        if ($this->users->findByEmail($payload['email'])) {
            throw new RuntimeException('A user with this email already exists.');
        }

        $id = $this->users->create([
            'name' => $payload['name'],
            'username' => $payload['username'] ?? null,
            'email' => $payload['email'],
            'phone' => $payload['phone'] ?? '',
            'password' => $payload['password'],
            'role' => 'member',
            'account_status' => $payload['account_status'] ?? 'pending_approval',
        ]);

        return $this->users->findById($id) ?? [];
    }

    public function updateLastLogin(int $id): void
    {
        $this->users->updateById($id, ['last_login_at' => date('Y-m-d H:i:s')]);
    }
}

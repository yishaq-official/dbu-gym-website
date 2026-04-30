<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Models\Membership;

final class MembershipService
{
    private Membership $memberships;

    public function __construct(?Membership $memberships = null)
    {
        $this->memberships = $memberships ?? new Membership();
    }

    public function findLatestByUserId(int $userId): ?array
    {
        return $this->memberships->findLatestByUserId($userId);
    }

    public function create(array $payload): array
    {
        $id = $this->memberships->create($payload);
        return $this->memberships->findById($id) ?? [];
    }
}

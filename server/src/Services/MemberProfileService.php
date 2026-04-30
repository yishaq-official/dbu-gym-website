<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Models\MemberProfile;

final class MemberProfileService
{
    private MemberProfile $profiles;

    public function __construct(?MemberProfile $profiles = null)
    {
        $this->profiles = $profiles ?? new MemberProfile();
    }

    public function findByUserId(int $userId): ?array
    {
        return $this->profiles->findByUserId($userId);
    }

    public function create(array $payload): array
    {
        $id = $this->profiles->create($payload);

        // Return via user_id since that's the primary lookup pattern in this app.
        return $this->profiles->findByUserId((int) $payload['user_id']) ?? ['id' => $id];
    }
}

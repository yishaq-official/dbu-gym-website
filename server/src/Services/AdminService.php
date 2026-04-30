<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Models\User;
use Yishaq\Server\Models\MemberProfile;

final class AdminService
{
    private User $users;
    private MemberProfile $profiles;

    public function __construct(?User $users = null, ?MemberProfile $profiles = null)
    {
        $this->users = $users ?? new User();
        $this->profiles = $profiles ?? new MemberProfile();
    }

    public function createMember(array $payload): array
    {
        // Validate and create user
        $userId = $this->users->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'phone' => $payload['phone'] ?? '',
            'password' => password_hash('defaultpassword', PASSWORD_DEFAULT), // Set a default, admin can change
            'role' => 'member',
            'account_status' => $payload['account_status'] ?? 'active',
        ]);

        // Create member profile
        $this->profiles->create([
            'user_id' => $userId,
            'member_id' => $payload['member_id'] ?? null,
            'member_type' => $payload['member_type'] ?? 'university',
            'membership_type' => $payload['membership_type'] ?? 'monthly',
            'university_id' => $payload['university_id'] ?? null,
            'department' => $payload['department'] ?? null,
            'national_id' => $payload['national_id'] ?? null,
            'address' => $payload['address'] ?? null,
            'gender' => $payload['gender'] ?? null,
            'date_of_birth' => $payload['date_of_birth'] ?? null,
            'emergency_contact_name' => $payload['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $payload['emergency_contact_phone'] ?? null,
        ]);

        return $this->users->findById($userId) ?? [];
    }

    public function updateMember(int $userId, array $payload): array
    {
        // Update user
        $userAttributes = array_intersect_key($payload, array_flip(['name', 'email', 'phone']));
        if ($userAttributes) {
            $this->users->updateById($userId, $userAttributes);
        }

        // Update profile
        $profileAttributes = array_intersect_key($payload, array_flip([
            'member_id', 'member_type', 'membership_type', 'university_id', 'department',
            'national_id', 'address', 'gender', 'date_of_birth', 'emergency_contact_name', 'emergency_contact_phone'
        ]));
        if ($profileAttributes) {
            $this->profiles->updateByUserId($userId, $profileAttributes);
        }

        return $this->users->findById($userId) ?? [];
    }

    public function updateMemberStatus(int $userId, string $status): void
    {
        $validStatuses = ['active', 'pending_approval', 'rejected', 'suspended'];
        if (!in_array($status, $validStatuses)) {
            throw new RuntimeException('Invalid status.');
        }

        $this->users->updateById($userId, ['account_status' => $status]);
    }
}
<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Contracts\Services\MemberServiceInterface;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Exceptions\ValidationException;
use Yishaq\Server\Validators\MemberValidator;

final class MemberService implements MemberServiceInterface
{
    public function __construct(
        private readonly UserService $users = new UserService(),
        private readonly MemberProfileService $profiles = new MemberProfileService(),
        private readonly MembershipService $memberships = new MembershipService(),
        private readonly NotificationService $notifications = new NotificationService(),
        private readonly FileService $files = new FileService()
    ) {
    }

    public function dashboard(array $user): array
    {
        $profile = is_array($user['member_profile'] ?? null) ? $user['member_profile'] : [];
        $membership = is_array($user['membership'] ?? null) ? $user['membership'] : [];

        $userId = (int) ($user['id'] ?? 0);
        if ($userId > 0) {
            $paidMembership = $this->memberships->findLatestPaidByUserId($userId);
            if (is_array($paidMembership) && $paidMembership !== []) {
                $membership = $paidMembership;
            }
        }

        $expiryRaw = (string) ($membership['plan_expires_at'] ?? '');
        $remainingDays = null;
        if ($expiryRaw !== '') {
            $expiryTime = strtotime($expiryRaw);
            if ($expiryTime !== false) {
                $remainingDays = (int) ceil(($expiryTime - time()) / 86400);
            }
        }

        if ($userId > 0) {
            $this->notifications->maybeCreateExpiryNotification(
                $userId,
                is_int($remainingDays) ? $remainingDays : null,
                $membership['plan_expires_at'] ?? null
            );
        }

        return [
            'member' => $this->formatUser($user, $profile),
            'plan' => [
                'type' => $membership['membership_type'] ?? null,
                'start_date' => $membership['plan_start_at'] ?? null,
                'expiry_date' => $membership['plan_expires_at'] ?? null,
                'cost' => isset($membership['plan_cost']) ? (float) $membership['plan_cost'] : null,
                'payment_status' => $membership['payment_status'] ?? null,
                'remaining_days' => $remainingDays,
            ],
            'notifications' => $userId > 0 ? $this->notifications->latestForUser($userId, 10) : [],
        ];
    }

    public function profile(array $user): array
    {
        $profile = $this->profiles->findByUserId((int) $user['id']) ?? [];
        return [
            'user' => $this->formatUser($user, $profile),
        ];
    }

    public function updateProfile(array $user, array $payload): array
    {
        $validator = new MemberValidator();
        $errors = $validator->validateProfile($payload);
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $userId = (int) $user['id'];
        $email = strtolower(trim((string) $payload['email']));
        $existing = $this->users->findByEmail($email);
        if ($existing && (int) ($existing['id'] ?? 0) !== $userId) {
            throw new RuntimeException('A user with this email already exists.');
        }

        $updatedUser = $this->users->updateProfile($userId, [
            'name' => trim((string) $payload['name']),
            'email' => $email,
            'phone' => trim((string) ($payload['phone'] ?? '')),
        ]) ?? $user;

        $profile = $this->profiles->updateByUserId($userId, [
            'department' => $payload['department'] ?? null,
            'date_of_birth' => $payload['date_of_birth'] ?? null,
            'emergency_contact_name' => $payload['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $payload['emergency_contact_phone'] ?? null,
            'address' => $payload['address'] ?? null,
        ]) ?? [];

        return [
            'user' => $this->formatUser($updatedUser, $profile),
        ];
    }

    public function updatePassword(array $user, array $payload): void
    {
        $validator = new MemberValidator(max(8, (int) AppContext::config()->get('auth.password.min_length', 8)));
        $errors = $validator->validatePassword($payload);
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $fresh = $this->users->findById((int) $user['id']);
        if (!$fresh || !password_verify((string) $payload['current_password'], (string) ($fresh['password'] ?? ''))) {
            throw new RuntimeException('Current password is incorrect.');
        }

        $hashedPassword = password_hash((string) $payload['password'], PASSWORD_DEFAULT);
        if ($hashedPassword === false) {
            throw new RuntimeException('Failed to secure password.');
        }

        $this->users->updatePasswordById((int) $user['id'], $hashedPassword);
    }

    public function uploadAvatar(array $user, array $file): array
    {
        $path = $this->files->storeAvatar($file);
        $updated = $this->users->updateProfile((int) $user['id'], ['avatar_path' => $path]) ?? $user;
        $profile = $this->profiles->findByUserId((int) $user['id']) ?? [];

        return [
            'avatar_url' => $this->assetUrl($path),
            'user' => $this->formatUser($updated, $profile),
        ];
    }

    public function renew(array $user, array $payload): array
    {
        $validator = new MemberValidator();
        $errors = $validator->validateRenewal($payload);
        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $profile = $this->profiles->findByUserId((int) $user['id']) ?? [];
        $membershipType = $validator->normalizeMembershipType((string) $payload['membership_type']);
        $memberType = (string) ($profile['member_type'] ?? 'university');

        $this->memberships->createRenewal(
            (int) $user['id'],
            $membershipType,
            $this->resolvePlanCost($membershipType, $memberType)
        );

        $freshUser = $this->users->findById((int) $user['id']) ?? $user;
        $freshUser['member_profile'] = $profile;
        $freshUser['membership'] = $this->memberships->findLatestByUserId((int) $user['id']);

        return $this->dashboard($freshUser);
    }

    private function formatUser(array $user, array $profile): array
    {
        $avatarPath = (string) ($user['avatar_path'] ?? '');

        return [
            'id' => isset($user['id']) ? (int) $user['id'] : null,
            'name' => $user['name'] ?? null,
            'email' => $user['email'] ?? null,
            'phone' => $user['phone'] ?? null,
            'avatar_url' => $avatarPath !== '' ? $this->assetUrl($avatarPath) : null,
            'member_id' => $profile['member_id'] ?? null,
            'member_type' => $profile['member_type'] ?? null,
            'status' => $user['account_status'] ?? null,
            'membership_type' => $profile['membership_type'] ?? null,
            'university_id' => $profile['university_id'] ?? null,
            'department' => $profile['department'] ?? null,
            'national_id' => $profile['national_id'] ?? null,
            'address' => $profile['address'] ?? null,
            'gender' => $profile['gender'] ?? null,
            'date_of_birth' => $profile['date_of_birth'] ?? null,
            'emergency_contact_name' => $profile['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $profile['emergency_contact_phone'] ?? null,
        ];
    }

    private function resolvePlanCost(string $membershipType, string $memberType): float
    {
        $prices = [
            'strength-training' => 400.0,
            'cardio-training' => 500.0,
            'aerobics-training' => 500.0,
            'vip-training' => 1000.0,
            'monthly' => 300.0,
            '3months' => 800.0,
            '6months' => 1500.0,
            '1year' => 2500.0,
        ];

        $base = $prices[$membershipType] ?? 300.0;
        return $memberType === 'university' ? round($base * 0.8, 2) : $base;
    }

    private function assetUrl(string $path): string
    {
        $appUrl = rtrim((string) AppContext::config()->get('app.url', ''), '/');
        return $appUrl !== '' ? $appUrl . '/' . ltrim($path, '/') : '/' . ltrim($path, '/');
    }
}

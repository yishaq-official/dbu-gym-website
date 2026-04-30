<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Contracts\Services\AuthServiceInterface;
use Yishaq\Server\Core\AppContext;

final class AuthService implements AuthServiceInterface
{
    private UserService $users;
    private MemberProfileService $profiles;
    private MembershipService $memberships;

    public function __construct(
        ?UserService $users = null,
        ?MemberProfileService $profiles = null,
        ?MembershipService $memberships = null
    ) {
        $this->users = $users ?? new UserService();
        $this->profiles = $profiles ?? new MemberProfileService();
        $this->memberships = $memberships ?? new MembershipService();
    }

    public function register(array $payload): array
    {
        $name = trim((string) ($payload['name'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $password = (string) ($payload['password'] ?? '');
        $passwordConfirmation = (string) ($payload['password_confirmation'] ?? '');

        if ($name === '' || $email === '' || $password === '') {
            throw new RuntimeException('Name, email, and password are required.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('Email format is invalid.');
        }

        if ($password !== $passwordConfirmation) {
            throw new RuntimeException('Password confirmation does not match.');
        }

        if (strlen($password) < 8) {
            throw new RuntimeException('Password must be at least 8 characters.');
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        if ($hashedPassword === false) {
            throw new RuntimeException('Failed to secure password.');
        }

        return AppContext::database()->transaction(function () use ($payload, $name, $email, $hashedPassword): array {
            $memberTypeRaw = strtolower((string) ($payload['member_type'] ?? 'university'));
            $memberType = in_array($memberTypeRaw, ['university', 'external'], true) ? $memberTypeRaw : 'university';

            $membershipType = strtolower((string) ($payload['membership_type'] ?? 'monthly'));
            $allowedPlans = ['monthly', '3months', '6months', '1year'];
            if (!in_array($membershipType, $allowedPlans, true)) {
                $membershipType = 'monthly';
            }

            $planCost = $this->resolvePlanCost($membershipType, $memberType);
            $memberId = $this->generateMemberId($memberType);

            $user = $this->users->createMember([
                'name' => $name,
                'username' => $payload['username'] ?? null,
                'email' => $email,
                'phone' => $payload['phone'] ?? '',
                'password' => $hashedPassword,
                'account_status' => 'pending_approval',
            ]);

            $userId = (int) ($user['id'] ?? 0);
            if ($userId <= 0) {
                throw new RuntimeException('User registration failed.');
            }

            $this->profiles->create([
                'user_id' => $userId,
                'member_id' => $memberId,
                'member_type' => $memberType,
                'gender' => $payload['gender'] ?? null,
                'membership_type' => $membershipType,
                'university_id' => $payload['university_id'] ?? null,
                'department' => $payload['department'] ?? null,
                'national_id' => $payload['national_id'] ?? null,
                'address' => $payload['address'] ?? null,
                'terms_accepted_at' => !empty($payload['terms_accepted']) ? date('Y-m-d H:i:s') : null,
            ]);

            $this->memberships->create([
                'user_id' => $userId,
                'membership_type' => $membershipType,
                'plan_cost' => $planCost,
                'currency' => 'ETB',
                'membership_status' => 'pending',
                'payment_status' => 'pending',
            ]);

            $token = $this->issueToken($userId, (string) $user['role']);

            return [
                'user' => $this->me($userId),
                'token' => $token,
            ];
        });
    }

    public function login(array $payload): array
    {
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $password = (string) ($payload['password'] ?? '');

        if ($email === '' || $password === '') {
            throw new RuntimeException('Email and password are required.');
        }

        $user = $this->users->findByEmail($email);
        if (!$user) {
            throw new RuntimeException('Invalid credentials.');
        }

        if (!password_verify($password, (string) ($user['password'] ?? ''))) {
            throw new RuntimeException('Invalid credentials.');
        }

        $userId = (int) $user['id'];
        $this->users->updateLastLogin($userId);

        return [
            'user' => $this->me($userId),
            'token' => $this->issueToken($userId, (string) $user['role']),
        ];
    }

    public function me(int $userId): ?array
    {
        $user = $this->users->findById($userId);
        if (!$user) {
            return null;
        }

        unset($user['password']);

        $profile = $this->profiles->findByUserId($userId);
        $membership = $this->memberships->findLatestByUserId($userId);

        if ($profile) {
            $user['member_profile'] = $profile;
            $user['member_id'] = $profile['member_id'] ?? null;
            $user['member_type'] = $profile['member_type'] ?? null;
            $user['membership_type'] = $profile['membership_type'] ?? null;
            $user['university_id'] = $profile['university_id'] ?? null;
            $user['department'] = $profile['department'] ?? null;
            $user['national_id'] = $profile['national_id'] ?? null;
            $user['address'] = $profile['address'] ?? null;
        }

        if ($membership) {
            $user['membership'] = $membership;
            $user['membership_status'] = $membership['membership_status'] ?? null;
            $user['payment_status'] = $membership['payment_status'] ?? null;
            $user['plan_cost'] = $membership['plan_cost'] ?? null;
            $user['plan_start_at'] = $membership['plan_start_at'] ?? null;
            $user['plan_expires_at'] = $membership['plan_expires_at'] ?? null;
        }

        return $user;
    }

    public function userIdFromRequestToken(string $token): ?int
    {
        $decoded = base64_decode($token, true);
        if ($decoded === false) {
            return null;
        }

        $payload = json_decode($decoded, true);
        if (!is_array($payload)) {
            return null;
        }

        $exp = (int) ($payload['exp'] ?? 0);
        if ($exp > 0 && $exp < time()) {
            return null;
        }

        $userId = (int) ($payload['sub'] ?? 0);
        return $userId > 0 ? $userId : null;
    }

    private function issueToken(int $userId, string $role): string
    {
        $payload = [
            'sub' => $userId,
            'role' => $role,
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24 * 7),
        ];

        return base64_encode((string) json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    private function resolvePlanCost(string $membershipType, string $memberType): float
    {
        $prices = [
            'monthly' => 300.0,
            '3months' => 800.0,
            '6months' => 1500.0,
            '1year' => 2500.0,
        ];

        $base = $prices[$membershipType] ?? 300.0;

        if ($memberType === 'university') {
            return round($base * 0.8, 2);
        }

        return $base;
    }

    private function generateMemberId(string $memberType): string
    {
        $prefix = $memberType === 'university' ? 'DBU' : 'EXT';
        $year = date('Y');
        $random = random_int(1000, 9999);

        return sprintf('%s-%s-%d', $prefix, $year, $random);
    }
}

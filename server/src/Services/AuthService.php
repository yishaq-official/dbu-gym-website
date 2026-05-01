<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Contracts\Services\AuthServiceInterface;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Exceptions\ValidationException;
use Yishaq\Server\Helpers\JwtHelper;
use Yishaq\Server\Models\AuthTokenSession;
use Yishaq\Server\Models\PasswordResetToken;
use Yishaq\Server\Services\MailService;
use Yishaq\Server\Validators\AuthValidator;

final class AuthService implements AuthServiceInterface
{
    private UserService $users;
    private MemberProfileService $profiles;
    private MembershipService $memberships;
    private AuthTokenSession $tokenSessions;
    private PasswordResetToken $resetTokens;
    private JwtHelper $jwt;
    private MailService $mailer;

    public function __construct(
        ?UserService $users = null,
        ?MemberProfileService $profiles = null,
        ?MembershipService $memberships = null,
        ?AuthTokenSession $tokenSessions = null,
        ?PasswordResetToken $resetTokens = null,
        ?JwtHelper $jwt = null,
        ?MailService $mailer = null
    ) {
        $this->users = $users ?? new UserService();
        $this->profiles = $profiles ?? new MemberProfileService();
        $this->memberships = $memberships ?? new MembershipService();
        $this->tokenSessions = $tokenSessions ?? new AuthTokenSession();
        $this->resetTokens = $resetTokens ?? new PasswordResetToken();
        $this->jwt = $jwt ?? new JwtHelper();
        $this->mailer = $mailer ?? new MailService();
    }

    public function register(array $payload): array
    {
        $name = trim((string) ($payload['name'] ?? ''));
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $password = (string) ($payload['password'] ?? '');
        $this->validateOrFail((new AuthValidator($this->passwordMinLength()))->validateRegister($payload));

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        if ($hashedPassword === false) {
            throw new RuntimeException('Failed to secure password.');
        }

        return AppContext::database()->transaction(function () use ($payload, $name, $email, $hashedPassword): array {
            $memberTypeRaw = strtolower((string) ($payload['member_type'] ?? 'university'));
            $memberType = in_array($memberTypeRaw, ['university', 'external'], true) ? $memberTypeRaw : 'university';

            $membershipType = strtolower((string) ($payload['membership_type'] ?? 'monthly'));
            $membershipType = str_replace([' ', '_'], '-', trim($membershipType));
            $membershipType = match ($membershipType) {
                'strengthtraining', 'strengthtrainingdubbell', 'strength' => 'strength-training',
                'cardiotraining', 'cardio' => 'cardio-training',
                'aerobicstraining', 'aerobics' => 'aerobics-training',
                'viptraining', 'vip' => 'vip-training',
                '3month' => '3months',
                'yearly', 'annual' => '1year',
                default => $membershipType,
            };
            $allowedPlans = ['strength-training', 'cardio-training', 'aerobics-training', 'vip-training', 'monthly', '3months', '6months', '1year'];
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
        $this->validateOrFail((new AuthValidator($this->passwordMinLength()))->validateLogin($payload));

        $user = $this->users->findByEmail($email);
        if (!$user) {
            throw new RuntimeException('Invalid credentials.');
        }

        // Check if account is locked due to too many failed attempts
        if (isset($user['lockout_until']) && $user['lockout_until'] !== null) {
            $lockoutTime = strtotime((string) $user['lockout_until']);
            if ($lockoutTime > time()) {
                throw new RuntimeException('Account is temporarily locked due to too many failed login attempts.');
            }
        }

        if (!password_verify($password, (string) ($user['password'] ?? ''))) {
            // Increment failed login attempts
            $this->incrementLoginAttempts((int) $user['id']);
            throw new RuntimeException('Invalid credentials.');
        }

        // Reset login attempts on successful login
        $this->resetLoginAttempts((int) $user['id']);

        $userId = (int) $user['id'];
        $this->users->updateLastLogin($userId);

        return [
            'user' => $this->me($userId),
            'token' => $this->issueToken($userId, (string) $user['role']),
        ];
    }

    public function googleRedirectUrl(): string
    {
        $clientId = trim((string) AppContext::config()->get('services.google.client_id', ''));
        if ($clientId === '') {
            throw new RuntimeException('Google client ID is not configured.');
        }

        $state = bin2hex(random_bytes(24));
        if (session_status() === PHP_SESSION_ACTIVE) {
            $_SESSION['google_oauth_state'] = $state;
        }

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $this->googleRedirectUri(),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ], '', '&', PHP_QUERY_RFC3986);
    }

    public function loginWithGoogleCallback(string $code, string $state): array
    {
        $code = trim($code);
        $state = trim($state);

        if ($code === '') {
            throw new RuntimeException('Google authorization code is missing.');
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            $expectedState = (string) ($_SESSION['google_oauth_state'] ?? '');
            unset($_SESSION['google_oauth_state']);
            if ($expectedState === '' || !hash_equals($expectedState, $state)) {
                throw new RuntimeException('Google login state is invalid.');
            }
        }

        $token = $this->fetchGoogleToken($code);
        $accessToken = (string) ($token['access_token'] ?? '');
        if ($accessToken === '') {
            throw new RuntimeException('Google did not return an access token.');
        }

        $profile = $this->fetchGoogleProfile($accessToken);
        $email = strtolower(trim((string) ($profile['email'] ?? '')));
        if ($email === '') {
            throw new RuntimeException('google_email_missing');
        }

        $user = $this->users->findByEmail($email);
        if (!$user) {
            throw new RuntimeException('account_not_found');
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
        $payload = $this->decodeToken($token);
        if ($payload === null) {
            return null;
        }

        $jti = (string) ($payload['jti'] ?? '');
        if ($jti === '' || !$this->tokenSessions->findActive($jti)) {
            return null;
        }

        $userId = (int) ($payload['sub'] ?? 0);
        return $userId > 0 ? $userId : null;
    }

    public function logout(string $token): void
    {
        $payload = $this->decodeToken($token);
        $jti = is_array($payload) ? (string) ($payload['jti'] ?? '') : '';
        if ($jti !== '') {
            $this->tokenSessions->revoke($jti);
        }
    }

    public function requestPasswordReset(array $payload): array
    {
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $this->validateOrFail((new AuthValidator($this->passwordMinLength()))->validateForgotPassword($payload));

        $user = $this->users->findByEmail($email);
        $plainToken = bin2hex(random_bytes(32));

        if ($user) {
            $frontendUrl = rtrim((string) AppContext::config()->get('services.frontend_url', ''), '/');
            $resetUrl = $frontendUrl . '/reset-password?email=' . rawurlencode($email) . '&token=' . rawurlencode($plainToken);

            $hashedToken = password_hash($plainToken, PASSWORD_DEFAULT);
            if ($hashedToken === false) {
                throw new RuntimeException('Failed to secure reset token.');
            }

            $this->resetTokens->store($email, $hashedToken);
            $this->mailer->sendPasswordResetEmail($email, $resetUrl);
        }

        return [
            'email' => $email,
        ];

        return $response;
    }

    public function resetPassword(array $payload): void
    {
        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $token = (string) ($payload['token'] ?? '');
        $password = (string) ($payload['password'] ?? '');

        $this->validateOrFail((new AuthValidator($this->passwordMinLength()))->validateResetPassword($payload));

        $stored = $this->resetTokens->findByEmail($email);
        if (!$stored || !password_verify($token, (string) ($stored['token'] ?? ''))) {
            throw new RuntimeException('Reset token is invalid or expired.');
        }

        $createdAt = strtotime((string) ($stored['created_at'] ?? ''));
        if ($createdAt === false || $createdAt < (time() - 3600)) {
            $this->resetTokens->deleteByEmail($email);
            throw new RuntimeException('Reset token is invalid or expired.');
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        if ($hashedPassword === false) {
            throw new RuntimeException('Failed to secure password.');
        }

        $this->users->updatePasswordByEmail($email, $hashedPassword);
        $this->resetTokens->deleteByEmail($email);
    }

    private function issueToken(int $userId, string $role): string
    {
        $now = time();
        $ttl = max(300, (int) AppContext::config()->get('auth.token.ttl_seconds', 604800));
        $jti = bin2hex(random_bytes(16));
        $payload = [
            'sub' => $userId,
            'role' => $role,
            'iss' => (string) AppContext::config()->get('auth.token.issuer', 'dbugym-api'),
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttl,
            'jti' => $jti,
        ];

        $this->tokenSessions->createTokenSession($jti, $userId, $payload);

        return $this->jwt->encode($payload, $this->tokenSecret());
    }

    private function decodeToken(string $token): ?array
    {
        return $this->jwt->decode(
            $token,
            $this->tokenSecret(),
            (string) AppContext::config()->get('auth.token.issuer', 'dbugym-api')
        );
    }

    private function tokenSecret(): string
    {
        return (string) AppContext::config()->get('auth.token.secret', '');
    }

    private function googleRedirectUri(): string
    {
        $configured = trim((string) AppContext::config()->get('services.google.redirect_uri', ''));
        if ($configured !== '') {
            return $configured;
        }

        return rtrim((string) AppContext::config()->get('app.url', 'http://localhost/gym-website/server/public'), '/')
            . '/api/auth/google/callback';
    }

    private function fetchGoogleToken(string $code): array
    {
        $clientId = trim((string) AppContext::config()->get('services.google.client_id', ''));
        $clientSecret = trim((string) AppContext::config()->get('services.google.client_secret', ''));

        if ($clientId === '' || $clientSecret === '') {
            throw new RuntimeException('Google OAuth credentials are not configured.');
        }

        return $this->requestJson('https://oauth2.googleapis.com/token', [
            'method' => 'POST',
            'headers' => [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
            ],
            'body' => http_build_query([
                'code' => $code,
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'redirect_uri' => $this->googleRedirectUri(),
                'grant_type' => 'authorization_code',
            ], '', '&', PHP_QUERY_RFC3986),
        ]);
    }

    private function fetchGoogleProfile(string $accessToken): array
    {
        return $this->requestJson('https://www.googleapis.com/oauth2/v3/userinfo', [
            'method' => 'GET',
            'headers' => [
                'Accept: application/json',
                'Authorization: Bearer ' . $accessToken,
            ],
        ]);
    }

    private function requestJson(string $url, array $options): array
    {
        $method = (string) ($options['method'] ?? 'GET');
        $headers = $options['headers'] ?? [];
        $body = (string) ($options['body'] ?? '');

        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'content' => $body,
                'ignore_errors' => true,
                'timeout' => 15,
            ],
        ]);

        $raw = file_get_contents($url, false, $context);
        if ($raw === false) {
            throw new RuntimeException('Unable to contact Google OAuth service.');
        }

        $status = 0;
        foreach (($http_response_header ?? []) as $header) {
            if (preg_match('/^HTTP\/\S+\s+(\d+)/', $header, $matches) === 1) {
                $status = (int) $matches[1];
                break;
            }
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Google returned an invalid response.');
        }

        if ($status >= 400) {
            $message = (string) ($decoded['error_description'] ?? $decoded['error'] ?? 'Google OAuth request failed.');
            throw new RuntimeException($message);
        }

        return $decoded;
    }

    private function passwordMinLength(): int
    {
        return max(8, (int) AppContext::config()->get('auth.password.min_length', 8));
    }

    private function validateOrFail(array $errors): void
    {
        if ($errors !== []) {
            throw new ValidationException($errors);
        }
    }

    private function isDebug(): bool
    {
        return (bool) AppContext::config()->get('app.debug', false);
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

    private function generateMemberId(string $memberType): string
    {
        $prefix = $memberType === 'university' ? 'DBU' : 'EXT';
        $year = date('Y');
        $random = random_int(1000, 9999);

        return sprintf('%s-%s-%d', $prefix, $year, $random);
    }

    private function incrementLoginAttempts(int $userId): void
    {
        $db = AppContext::database();

        // Get current attempts and max attempts from settings
        $user = $db->first("SELECT login_attempts FROM users WHERE id = ?", [$userId]);
        $settings = $db->first("SELECT max_login_attempts FROM system_settings WHERE id = 1 LIMIT 1");

        $currentAttempts = (int) ($user['login_attempts'] ?? 0);
        $maxAttempts = (int) ($settings['max_login_attempts'] ?? 3);

        $newAttempts = $currentAttempts + 1;

        if ($newAttempts >= $maxAttempts) {
            // Lock account for 15 minutes
            $lockoutUntil = date('Y-m-d H:i:s', time() + 900); // 15 minutes
            $db->statement(
                "UPDATE users SET login_attempts = ?, lockout_until = ? WHERE id = ?",
                [$newAttempts, $lockoutUntil, $userId]
            );
        } else {
            $db->statement(
                "UPDATE users SET login_attempts = ? WHERE id = ?",
                [$newAttempts, $userId]
            );
        }
    }

    private function resetLoginAttempts(int $userId): void
    {
        $db = AppContext::database();
        $db->statement(
            "UPDATE users SET login_attempts = 0, lockout_until = NULL WHERE id = ?",
            [$userId]
        );
    }
}

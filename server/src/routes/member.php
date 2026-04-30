<?php

declare(strict_types=1);

use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Middleware\AuthMiddleware;
use Yishaq\Server\Middleware\RoleMiddleware;

if (!function_exists('memberRequireAuth')) {
    function memberRequireAuth(Request $request): array
    {
        $user = (new AuthMiddleware())->authenticate($request);
        return (new RoleMiddleware('member'))->authorize($user);
    }
}

$router->get('/api/member/dashboard', static function (Request $request, Response $response): void {
    $user = memberRequireAuth($request);

    $profile = is_array($user['member_profile'] ?? null) ? $user['member_profile'] : [];
    $membership = is_array($user['membership'] ?? null) ? $user['membership'] : [];

    $expiryRaw = (string) ($membership['plan_expires_at'] ?? '');
    $remainingDays = null;
    if ($expiryRaw !== '') {
        $expiryTime = strtotime($expiryRaw);
        if ($expiryTime !== false) {
            $remainingDays = (int) ceil(($expiryTime - time()) / 86400);
        }
    }

    $payload = [
        'member' => [
            'name' => $user['name'] ?? null,
            'email' => $user['email'] ?? null,
            'phone' => $user['phone'] ?? null,
            'avatar_url' => null,
            'member_id' => $profile['member_id'] ?? null,
            'member_type' => $profile['member_type'] ?? null,
            'status' => $user['account_status'] ?? null,
            'university_id' => $profile['university_id'] ?? null,
            'department' => $profile['department'] ?? null,
            'date_of_birth' => $profile['date_of_birth'] ?? null,
            'emergency_contact_name' => $profile['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $profile['emergency_contact_phone'] ?? null,
        ],
        'plan' => [
            'type' => $membership['membership_type'] ?? null,
            'start_date' => $membership['plan_start_at'] ?? null,
            'expiry_date' => $membership['plan_expires_at'] ?? null,
            'cost' => isset($membership['plan_cost']) ? (float) $membership['plan_cost'] : null,
            'payment_status' => $membership['payment_status'] ?? null,
            'remaining_days' => $remainingDays,
        ],
    ];

    $response->json(
        [
            'success' => true,
            'message' => 'Member dashboard data fetched.',
            'data' => $payload,
        ],
        200
    );
});

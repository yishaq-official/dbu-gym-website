<?php

declare(strict_types=1);

use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Middleware\AuthMiddleware;
use Yishaq\Server\Middleware\RoleMiddleware;

if (!function_exists('adminRequireAuth')) {
    function adminRequireAuth(Request $request): array
    {
        $user = (new AuthMiddleware())->authenticate($request);
        return (new RoleMiddleware('admin'))->authorize($user);
    }
}

$router->get('/api/admin/dashboard', static function (Request $request, Response $response): void {
    adminRequireAuth($request);
    $db = AppContext::database();

    $stats = $db->first(
        "SELECT
            COUNT(CASE WHEN role = 'member' THEN 1 END) AS total_members,
            COUNT(CASE WHEN role = 'member' AND account_status = 'active' THEN 1 END) AS active_members,
            COUNT(CASE WHEN role = 'member' AND account_status = 'pending_approval' THEN 1 END) AS pending_members,
            COUNT(CASE WHEN role = 'member' AND account_status = 'active' THEN 1 END) AS approved_members,
            COUNT(CASE WHEN role = 'member' AND account_status = 'rejected' THEN 1 END) AS rejected_members
         FROM users"
    ) ?? [];

    $revenue = $db->first(
        "SELECT COALESCE(SUM(plan_cost), 0) AS total_revenue
         FROM memberships
         WHERE payment_status = 'paid'"
    ) ?? [];

    $monthly = $db->select(
        "SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS ym,
            COUNT(*) AS joined
         FROM users
         WHERE role = 'member' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
         GROUP BY ym"
    );

    $expiredMonthly = $db->select(
        "SELECT
            DATE_FORMAT(plan_expires_at, '%Y-%m') AS ym,
            COUNT(*) AS expired_count
         FROM memberships
         WHERE plan_expires_at IS NOT NULL
           AND plan_expires_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
           AND plan_expires_at <= NOW()
         GROUP BY ym"
    );

    $pendingMonthly = $db->select(
        "SELECT
            DATE_FORMAT(created_at, '%Y-%m') AS ym,
            COUNT(*) AS pending_count
         FROM users
         WHERE role = 'member'
           AND account_status = 'pending_approval'
           AND created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
         GROUP BY ym"
    );

    $labels = [];
    $joined = [];
    $expired = [];
    $pending = [];
    for ($i = 5; $i >= 0; $i--) {
        $monthDate = strtotime("-{$i} months");
        $ym = date('Y-m', $monthDate);
        $labels[] = date('M', $monthDate);
        $joined[] = 0;
        $expired[] = 0;
        $pending[] = 0;

        foreach ($monthly as $row) {
            if (($row['ym'] ?? '') === $ym) {
                $joined[count($joined) - 1] = (int) ($row['joined'] ?? 0);
                break;
            }
        }
        foreach ($expiredMonthly as $row) {
            if (($row['ym'] ?? '') === $ym) {
                $expired[count($expired) - 1] = (int) ($row['expired_count'] ?? 0);
                break;
            }
        }
        foreach ($pendingMonthly as $row) {
            if (($row['ym'] ?? '') === $ym) {
                $pending[count($pending) - 1] = (int) ($row['pending_count'] ?? 0);
                break;
            }
        }
    }

    $response->json(
        [
            'success' => true,
            'message' => 'Admin dashboard data fetched.',
            'data' => [
                'stats' => [
                    'total_members' => (int) ($stats['total_members'] ?? 0),
                    'active_members' => (int) ($stats['active_members'] ?? 0),
                    'pending_members' => (int) ($stats['pending_members'] ?? 0),
                    'approved_members' => (int) ($stats['approved_members'] ?? 0),
                    'rejected_members' => (int) ($stats['rejected_members'] ?? 0),
                    'total_revenue' => (float) ($revenue['total_revenue'] ?? 0),
                ],
                'chart' => [
                    'labels' => $labels,
                    'joined' => $joined,
                    'expired' => $expired,
                    'pending' => $pending,
                ],
            ],
        ],
        200
    );
});

$router->get('/api/admin/members', static function (Request $request, Response $response): void {
    adminRequireAuth($request);
    $db = AppContext::database();

    $page = max(1, (int) $request->query('page', 1));
    $perPage = max(1, min(100, (int) $request->query('per_page', 8)));
    $offset = ($page - 1) * $perPage;
    $search = trim((string) $request->query('search', ''));
    $status = strtolower(trim((string) $request->query('status', '')));
    $memberType = strtolower(trim((string) $request->query('member_type', '')));

    $where = ["u.role = 'member'"];
    $bindings = [];

    if ($search !== '') {
        $where[] = '(u.name LIKE :search OR u.email LIKE :search OR mp.member_id LIKE :search)';
        $bindings['search'] = '%' . $search . '%';
    }

    if ($status !== '') {
        $normalized = $status === 'pendingapproval' ? 'pending_approval' : $status;
        $where[] = 'u.account_status = :status';
        $bindings['status'] = $normalized;
    }

    if ($memberType !== '') {
        $where[] = 'mp.member_type = :member_type';
        $bindings['member_type'] = $memberType;
    }

    $whereSql = implode(' AND ', $where);

    $countRow = $db->first(
        "SELECT COUNT(*) AS total
         FROM users u
         LEFT JOIN member_profiles mp ON mp.user_id = u.id
         WHERE {$whereSql}",
        $bindings
    ) ?? ['total' => 0];
    $total = (int) ($countRow['total'] ?? 0);
    $lastPage = max(1, (int) ceil($total / $perPage));

    $rows = $db->select(
        "SELECT
            u.id, u.name, u.email, u.phone, u.account_status, u.created_at,
            mp.member_id, mp.member_type, mp.membership_type, mp.university_id, mp.department, mp.national_id, mp.address, mp.gender,
            m.plan_start_at, m.plan_expires_at
         FROM users u
         LEFT JOIN member_profiles mp ON mp.user_id = u.id
         LEFT JOIN memberships m ON m.id = (
            SELECT m2.id FROM memberships m2 WHERE m2.user_id = u.id ORDER BY m2.id DESC LIMIT 1
         )
         WHERE {$whereSql}
         ORDER BY u.id DESC
         LIMIT {$perPage} OFFSET {$offset}",
        $bindings
    );

    $data = array_map(static function (array $row): array {
        $row['member_profile'] = [
            'membership_type' => $row['membership_type'] ?? null,
            'member_type' => $row['member_type'] ?? null,
            'membership_expiry_date' => $row['plan_expires_at'] ?? null,
        ];
        return $row;
    }, $rows);

    $response->json(
        [
            'success' => true,
            'message' => 'Members fetched.',
            'data' => $data,
            'meta' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'total' => $total,
                'per_page' => $perPage,
            ],
        ],
        200
    );
});

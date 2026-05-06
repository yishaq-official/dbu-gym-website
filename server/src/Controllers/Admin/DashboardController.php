<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;

final class DashboardController extends BaseController
{
    public function show(Request $request, Response $response, array $user): void
    {
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

        $expiringSoon = $db->select(
            "SELECT
                u.id AS user_id,
                u.name,
                u.email,
                u.phone,
                mp.member_id,
                mp.member_type,
                m.membership_type,
                m.plan_expires_at,
                GREATEST(DATEDIFF(DATE(m.plan_expires_at), CURDATE()), 0) AS days_left
             FROM users u
             LEFT JOIN member_profiles mp ON mp.user_id = u.id
             LEFT JOIN memberships m ON m.id = (
                SELECT m2.id
                FROM memberships m2
                WHERE m2.user_id = u.id
                  AND m2.payment_status = 'paid'
                  AND m2.plan_expires_at IS NOT NULL
                ORDER BY m2.plan_expires_at DESC, m2.id DESC
                LIMIT 1
             )
             WHERE u.role = 'member'
               AND u.account_status = 'active'
               AND m.plan_expires_at IS NOT NULL
               AND m.plan_expires_at > NOW()
               AND m.plan_expires_at <= DATE_ADD(NOW(), INTERVAL 5 DAY)
             ORDER BY m.plan_expires_at ASC
             LIMIT 10"
        );

        $labels = [];
        $joined = [];
        $expired = [];
        $pending = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = strtotime(date('Y-m-01') . " -{$i} months");
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

        $this->ok($response, [
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
            'expiring_soon' => array_map(
                static fn (array $row): array => [
                    'user_id' => (int) ($row['user_id'] ?? 0),
                    'name' => $row['name'] ?? null,
                    'email' => $row['email'] ?? null,
                    'phone' => $row['phone'] ?? null,
                    'member_id' => $row['member_id'] ?? null,
                    'member_type' => $row['member_type'] ?? null,
                    'membership_type' => $row['membership_type'] ?? null,
                    'plan_expires_at' => $row['plan_expires_at'] ?? null,
                    'days_left' => isset($row['days_left']) ? (int) $row['days_left'] : null,
                ],
                is_array($expiringSoon) ? $expiringSoon : []
            ),
        ], 'Admin dashboard data fetched.');
    }
}

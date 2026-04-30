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
        ], 'Admin dashboard data fetched.');
    }
}

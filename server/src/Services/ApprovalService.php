<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Database;
use Yishaq\Server\Models\ApprovalHistory;
use Yishaq\Server\Models\Membership;
use Yishaq\Server\Models\User;

final class ApprovalService
{
    private Database $db;
    private ApprovalHistory $history;
    private User $users;
    private Membership $memberships;

    public function __construct(
        ?Database $db = null,
        ?ApprovalHistory $history = null,
        ?User $users = null,
        ?Membership $memberships = null
    ) {
        $this->db = $db ?? AppContext::database();
        $this->history = $history ?? new ApprovalHistory();
        $this->users = $users ?? new User();
        $this->memberships = $memberships ?? new Membership();
    }

    public function getPendingApprovals(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $offset = ($page - 1) * $perPage;
        [$whereSql, $bindings] = $this->buildApprovalFilters($filters, "u.role = 'member' AND u.account_status = 'pending_approval'");

        $rows = $this->db->select(
            "SELECT
                u.id, u.name, u.email, u.phone, u.account_status, u.created_at,
                mp.member_id, mp.member_type, mp.membership_type, mp.university_id, mp.department, mp.national_id, mp.address, mp.gender,
                m.id AS membership_id, m.plan_cost, m.payment_status, m.membership_status, m.plan_start_at, m.plan_expires_at
             FROM users u
             LEFT JOIN member_profiles mp ON mp.user_id = u.id
             LEFT JOIN memberships m ON m.id = (
                SELECT m2.id FROM memberships m2 WHERE m2.user_id = u.id ORDER BY m2.id DESC LIMIT 1
             )
             WHERE {$whereSql}
             ORDER BY u.created_at DESC
             LIMIT {$perPage} OFFSET {$offset}",
            $bindings
        );

        $countRow = $this->db->first(
            "SELECT COUNT(*) AS total
             FROM users u
             LEFT JOIN member_profiles mp ON mp.user_id = u.id
             LEFT JOIN memberships m ON m.id = (
                SELECT m2.id FROM memberships m2 WHERE m2.user_id = u.id ORDER BY m2.id DESC LIMIT 1
             )
             WHERE {$whereSql}",
            $bindings
        ) ?? ['total' => 0];
        $total = (int) ($countRow['total'] ?? 0);
        $lastPage = max(1, (int) ceil($total / $perPage));

        return [
            'data' => $rows,
            'meta' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'total' => $total,
                'per_page' => $perPage,
            ],
        ];
    }

    public function approve(int $userId, int $adminId, ?string $reason = null): void
    {
        $this->db->transaction(function () use ($userId, $adminId, $reason): void {
            $user = $this->users->findById($userId);
            if (!$user || $user['role'] !== 'member' || $user['account_status'] !== 'pending_approval') {
                throw new RuntimeException('Invalid user for approval.');
            }

            $membership = $this->memberships->findLatestByUserId($userId);
            if (!$membership) {
                throw new RuntimeException('No membership found for user.');
            }

            $this->users->updateById($userId, ['account_status' => 'active']);

            $membershipStatus = $membership['payment_status'] === 'paid' ? 'active' : 'approved';
            $this->db->statement(
                "UPDATE memberships
                 SET membership_status = :status,
                     approved_by = :approved_by,
                     approved_at = NOW(),
                     rejected_by = NULL,
                     rejected_at = NULL,
                     rejection_reason = NULL,
                     updated_at = NOW()
                 WHERE id = :id",
                ['status' => $membershipStatus, 'approved_by' => $adminId, 'id' => $membership['id']]
            );

            $this->history->create([
                'membership_id' => $membership['id'],
                'user_id' => $userId,
                'action' => 'approved',
                'acted_by' => $adminId,
                'reason' => $reason,
                'payment_status' => $membership['payment_status'],
            ]);
        });
    }

    public function reject(int $userId, int $adminId, ?string $reason = null): void
    {
        $this->db->transaction(function () use ($userId, $adminId, $reason): void {
            $user = $this->users->findById($userId);
            if (!$user || $user['role'] !== 'member' || $user['account_status'] !== 'pending_approval') {
                throw new RuntimeException('Invalid user for rejection.');
            }

            $membership = $this->memberships->findLatestByUserId($userId);
            if (!$membership) {
                throw new RuntimeException('No membership found for user.');
            }

            $this->users->updateById($userId, ['account_status' => 'rejected']);

            $this->db->statement(
                "UPDATE memberships
                 SET membership_status = 'rejected',
                     rejected_by = :rejected_by,
                     rejected_at = NOW(),
                     rejection_reason = :reason,
                     updated_at = NOW()
                 WHERE id = :id",
                ['rejected_by' => $adminId, 'reason' => $reason, 'id' => $membership['id']]
            );

            $this->history->create([
                'membership_id' => $membership['id'],
                'user_id' => $userId,
                'action' => 'rejected',
                'acted_by' => $adminId,
                'reason' => $reason,
                'payment_status' => $membership['payment_status'],
            ]);
        });
    }

    public function getApprovalHistory(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        return $this->history->findAllWithDetails($page, $perPage, $filters);
    }

    private function buildApprovalFilters(array $filters, string $baseWhere): array
    {
        $where = [$baseWhere];
        $bindings = [];

        $search = trim((string) ($filters['search'] ?? ''));
        if ($search !== '') {
            $where[] = '(u.name LIKE :search OR u.email LIKE :search OR mp.member_id LIKE :search)';
            $bindings['search'] = '%' . $search . '%';
        }

        $memberType = strtolower(trim((string) ($filters['member_type'] ?? '')));
        if (in_array($memberType, ['university', 'external'], true)) {
            $where[] = 'mp.member_type = :member_type';
            $bindings['member_type'] = $memberType;
        }

        $paymentStatus = strtolower(trim((string) ($filters['payment_status'] ?? '')));
        if (in_array($paymentStatus, ['pending', 'paid', 'failed', 'refunded'], true)) {
            $where[] = 'm.payment_status = :payment_status';
            $bindings['payment_status'] = $paymentStatus;
        }

        if (isset($filters['min_plan_cost']) && is_numeric($filters['min_plan_cost'])) {
            $where[] = 'm.plan_cost >= :min_plan_cost';
            $bindings['min_plan_cost'] = (float) $filters['min_plan_cost'];
        }

        if (isset($filters['max_plan_cost']) && is_numeric($filters['max_plan_cost'])) {
            $where[] = 'm.plan_cost <= :max_plan_cost';
            $bindings['max_plan_cost'] = (float) $filters['max_plan_cost'];
        }

        $fromDate = trim((string) ($filters['from_date'] ?? ''));
        if ($this->isDate($fromDate)) {
            $where[] = 'DATE(u.created_at) >= :from_date';
            $bindings['from_date'] = $fromDate;
        }

        $toDate = trim((string) ($filters['to_date'] ?? ''));
        if ($this->isDate($toDate)) {
            $where[] = 'DATE(u.created_at) <= :to_date';
            $bindings['to_date'] = $toDate;
        }

        return [implode(' AND ', $where), $bindings];
    }

    private function isDate(string $value): bool
    {
        return (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $value);
    }
}

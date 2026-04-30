<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Models\ApprovalHistory;
use Yishaq\Server\Models\Membership;
use Yishaq\Server\Models\User;

final class ApprovalService
{
    private ApprovalHistory $history;
    private User $users;
    private Membership $memberships;

    public function __construct(
        ?ApprovalHistory $history = null,
        ?User $users = null,
        ?Membership $memberships = null
    ) {
        $this->history = $history ?? new ApprovalHistory();
        $this->users = $users ?? new User();
        $this->memberships = $memberships ?? new Membership();
    }

    public function getPendingApprovals(int $page = 1, int $perPage = 20): array
    {
        $offset = ($page - 1) * $perPage;

        $rows = $this->users->db->select(
            "SELECT
                u.id, u.name, u.email, u.phone, u.account_status, u.created_at,
                mp.member_id, mp.member_type, mp.membership_type, mp.university_id, mp.department, mp.national_id, mp.address, mp.gender,
                m.id AS membership_id, m.plan_cost, m.payment_status, m.membership_status, m.plan_start_at, m.plan_expires_at
             FROM users u
             LEFT JOIN member_profiles mp ON mp.user_id = u.id
             LEFT JOIN memberships m ON m.id = (
                SELECT m2.id FROM memberships m2 WHERE m2.user_id = u.id ORDER BY m2.id DESC LIMIT 1
             )
             WHERE u.role = 'member' AND u.account_status = 'pending_approval'
             ORDER BY u.created_at DESC
             LIMIT {$perPage} OFFSET {$offset}"
        );

        $countRow = $this->users->db->first(
            "SELECT COUNT(*) AS total
             FROM users u
             WHERE u.role = 'member' AND u.account_status = 'pending_approval'"
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
        $user = $this->users->findById($userId);
        if (!$user || $user['role'] !== 'member' || $user['account_status'] !== 'pending_approval') {
            throw new RuntimeException('Invalid user for approval.');
        }

        $membership = $this->memberships->findLatestByUserId($userId);
        if (!$membership) {
            throw new RuntimeException('No membership found for user.');
        }

        // Update user status
        $this->users->updateById($userId, ['account_status' => 'active']);

        // Update membership status based on payment
        $membershipStatus = $membership['payment_status'] === 'paid' ? 'active' : 'approved';
        $this->memberships->db->statement(
            "UPDATE memberships SET membership_status = :status WHERE id = :id",
            ['status' => $membershipStatus, 'id' => $membership['id']]
        );

        // Record approval history
        $this->history->create([
            'membership_id' => $membership['id'],
            'user_id' => $userId,
            'action' => 'approved',
            'acted_by' => $adminId,
            'reason' => $reason,
            'payment_status' => $membership['payment_status'],
        ]);
    }

    public function reject(int $userId, int $adminId, ?string $reason = null): void
    {
        $user = $this->users->findById($userId);
        if (!$user || $user['role'] !== 'member' || $user['account_status'] !== 'pending_approval') {
            throw new RuntimeException('Invalid user for rejection.');
        }

        $membership = $this->memberships->findLatestByUserId($userId);
        if (!$membership) {
            throw new RuntimeException('No membership found for user.');
        }

        // Update user status
        $this->users->updateById($userId, ['account_status' => 'rejected']);

        // Update membership status
        $this->memberships->db->statement(
            "UPDATE memberships SET membership_status = 'rejected' WHERE id = :id",
            ['id' => $membership['id']]
        );

        // Record rejection history
        $this->history->create([
            'membership_id' => $membership['id'],
            'user_id' => $userId,
            'action' => 'rejected',
            'acted_by' => $adminId,
            'reason' => $reason,
            'payment_status' => $membership['payment_status'],
        ]);
    }

    public function getApprovalHistory(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        return $this->history->findAllWithDetails($page, $perPage, $filters);
    }
}
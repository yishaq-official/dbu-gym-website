<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class ApprovalHistory extends BaseModel
{
    protected function table(): string
    {
        return 'approval_history';
    }

    public function create(array $payload): int
    {
        $this->db->statement(
            "INSERT INTO {$this->table()} (
                membership_id, user_id, action, acted_by, reason, payment_status, acted_at
            ) VALUES (
                :membership_id, :user_id, :action, :acted_by, :reason, :payment_status, NOW()
            )",
            [
                'membership_id' => $payload['membership_id'],
                'user_id' => $payload['user_id'],
                'action' => $payload['action'],
                'acted_by' => $payload['acted_by'],
                'reason' => $payload['reason'] ?? null,
                'payment_status' => $payload['payment_status'] ?? null,
            ]
        );

        return (int) $this->db->pdo()->lastInsertId();
    }

    public function findByUserId(int $userId): array
    {
        return $this->db->select(
            "SELECT * FROM {$this->table()} WHERE user_id = :user_id ORDER BY acted_at DESC",
            ['user_id' => $userId]
        );
    }

    public function findAllWithDetails(int $page = 1, int $perPage = 20, array $filters = []): array
    {
        $offset = ($page - 1) * $perPage;
        $where = [];
        $bindings = [];

        if (!empty($filters['action'])) {
            $where[] = 'ah.action = :action';
            $bindings['action'] = $filters['action'];
        }

        if (!empty($filters['search'])) {
            $where[] = '(u.name LIKE :search OR u.email LIKE :search OR mp.member_id LIKE :search)';
            $bindings['search'] = '%' . trim((string) $filters['search']) . '%';
        }

        if (!empty($filters['user_id'])) {
            $where[] = 'ah.user_id = :user_id';
            $bindings['user_id'] = $filters['user_id'];
        }

        if (!empty($filters['member_type']) && in_array($filters['member_type'], ['university', 'external'], true)) {
            $where[] = 'mp.member_type = :member_type';
            $bindings['member_type'] = $filters['member_type'];
        }

        if (!empty($filters['payment_status']) && in_array(strtolower((string) $filters['payment_status']), ['pending', 'paid', 'failed', 'refunded'], true)) {
            $where[] = 'm.payment_status = :payment_status';
            $bindings['payment_status'] = strtolower((string) $filters['payment_status']);
        }

        if (isset($filters['min_plan_cost']) && is_numeric($filters['min_plan_cost'])) {
            $where[] = 'm.plan_cost >= :min_plan_cost';
            $bindings['min_plan_cost'] = (float) $filters['min_plan_cost'];
        }

        if (isset($filters['max_plan_cost']) && is_numeric($filters['max_plan_cost'])) {
            $where[] = 'm.plan_cost <= :max_plan_cost';
            $bindings['max_plan_cost'] = (float) $filters['max_plan_cost'];
        }

        if (!empty($filters['from_date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $filters['from_date'])) {
            $where[] = 'DATE(ah.acted_at) >= :from_date';
            $bindings['from_date'] = $filters['from_date'];
        }

        if (!empty($filters['to_date']) && preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $filters['to_date'])) {
            $where[] = 'DATE(ah.acted_at) <= :to_date';
            $bindings['to_date'] = $filters['to_date'];
        }

        $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $rows = $this->db->select(
            "SELECT
                ah.*,
                u.name, u.name AS user_name, u.email, u.email AS user_email, u.account_status,
                mp.member_id, mp.member_type, mp.membership_type,
                m.plan_cost, m.payment_status, m.membership_status, m.rejection_reason,
                ab.name AS acted_by_name,
                CASE WHEN ah.action = 'approved' THEN ab.name ELSE NULL END AS approved_by_name,
                CASE WHEN ah.action = 'rejected' THEN ab.name ELSE NULL END AS rejected_by_name,
                CASE WHEN ah.action = 'approved' THEN ah.acted_at ELSE NULL END AS approved_at,
                CASE WHEN ah.action = 'rejected' THEN ah.acted_at ELSE NULL END AS rejected_at
             FROM {$this->table()} ah
             LEFT JOIN users u ON u.id = ah.user_id
             LEFT JOIN member_profiles mp ON mp.user_id = ah.user_id
             LEFT JOIN memberships m ON m.id = ah.membership_id
             LEFT JOIN users ab ON ab.id = ah.acted_by
             {$whereSql}
             ORDER BY ah.acted_at DESC
             LIMIT {$perPage} OFFSET {$offset}",
            $bindings
        );

        $countRow = $this->db->first(
            "SELECT COUNT(*) AS total
             FROM {$this->table()} ah
             LEFT JOIN users u ON u.id = ah.user_id
             LEFT JOIN member_profiles mp ON mp.user_id = ah.user_id
             LEFT JOIN memberships m ON m.id = ah.membership_id
             {$whereSql}",
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
}

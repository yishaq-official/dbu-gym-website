<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use RuntimeException;
use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\AdminService;
use Yishaq\Server\Services\AuditService;

final class MemberController extends BaseController
{
    private AdminService $admin;
    private AuditService $audit;

    public function __construct(?AdminService $admin = null, ?AuditService $audit = null)
    {
        $this->admin = $admin ?? new AdminService();
        $this->audit = $audit ?? new AuditService();
    }

    public function index(Request $request, Response $response, array $user): void
    {
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

        $this->ok($response, [
            'data' => $data,
            'meta' => [
                'current_page' => $page,
                'last_page' => $lastPage,
                'total' => $total,
                'per_page' => $perPage,
            ],
        ], 'Members fetched.');
    }

    public function create(Request $request, Response $response, array $user): void
    {
        try {
            $member = $this->admin->createMember($request->json());
            $this->ok($response, $member, 'Member created.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function update(Request $request, Response $response, array $user, array $params): void
    {
        $memberId = (int) ($params['id'] ?? 0);
        if ($memberId <= 0) {
            $this->error($response, 'Invalid member ID.', 400);
            return;
        }

        try {
            $member = $this->admin->updateMember($memberId, $request->json());
            $this->ok($response, $member, 'Member updated.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function updateStatus(Request $request, Response $response, array $user, array $params): void
    {
        $memberId = (int) ($params['id'] ?? 0);
        if ($memberId <= 0) {
            $this->error($response, 'Invalid member ID.', 400);
            return;
        }

        $payload = $request->json();
        $status = $payload['account_status'] ?? '';

        try {
            $this->admin->updateMemberStatus($memberId, $status);
            $this->audit->log('update_member_status', (int) $user['id'], [
                'member_id' => $memberId,
                'new_status' => $status
            ]);
            $this->ok($response, null, 'Member status updated.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }
}
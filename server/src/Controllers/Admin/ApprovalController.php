<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use RuntimeException;
use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\ApprovalService;
use Yishaq\Server\Services\AuditService;
use Yishaq\Server\Services\CsvService;

final class ApprovalController extends BaseController
{
    private ApprovalService $approvals;
    private CsvService $csv;
    private AuditService $audit;

    public function __construct(?ApprovalService $approvals = null, ?CsvService $csv = null, ?AuditService $audit = null)
    {
        $this->approvals = $approvals ?? new ApprovalService();
        $this->csv = $csv ?? new CsvService();
        $this->audit = $audit ?? new AuditService();
    }

    public function index(Request $request, Response $response, array $user): void
    {
        $status = strtolower(trim((string) $request->query('status', 'pending')));
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $filters = $this->filtersFromRequest($request);

        if ($status === 'pending') {
            $result = $this->approvals->getPendingApprovals($page, $perPage, $filters);
            $this->ok($response, $result, 'Pending approvals fetched.');
        } elseif ($status === 'all' || in_array($status, ['approved', 'rejected'], true)) {
            if ($status !== 'all') {
                $filters['action'] = $status;
            }
            $result = $this->approvals->getApprovalHistory($page, $perPage, $filters);
            $this->ok($response, $result, ucfirst($status) . ' approvals fetched.');
        } else {
            $this->error($response, 'Invalid status filter.', 400);
        }
    }

    public function approve(Request $request, Response $response, array $user, array $params): void
    {
        $memberId = (int) ($params['id'] ?? 0);
        if ($memberId <= 0) {
            $this->error($response, 'Invalid member ID.', 400);
            return;
        }

        $payload = $request->json();
        $reason = $payload['reason'] ?? null;

        try {
            $this->approvals->approve($memberId, (int) $user['id'], $reason);
            $this->audit->log('approve_member', (int) $user['id'], [
                'member_id' => $memberId,
                'reason' => $reason
            ]);
            $this->ok($response, null, 'Member approved.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function reject(Request $request, Response $response, array $user, array $params): void
    {
        $memberId = (int) ($params['id'] ?? 0);
        if ($memberId <= 0) {
            $this->error($response, 'Invalid member ID.', 400);
            return;
        }

        $payload = $request->json();
        $reason = $payload['reason'] ?? null;

        try {
            $this->approvals->reject($memberId, (int) $user['id'], $reason);
            $this->audit->log('reject_member', (int) $user['id'], [
                'member_id' => $memberId,
                'reason' => $reason
            ]);
            $this->ok($response, null, 'Member rejected.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function history(Request $request, Response $response, array $user): void
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $filters = $this->filtersFromRequest($request);

        if ($request->query('action')) {
            $filters['action'] = $request->query('action');
        }

        if ($request->query('status') && $request->query('status') !== 'all') {
            $filters['action'] = strtolower((string) $request->query('status'));
        }

        if ($request->query('user_id')) {
            $filters['user_id'] = (int) $request->query('user_id');
        }

        $result = $this->approvals->getApprovalHistory($page, $perPage, $filters);
        $this->ok($response, $result, 'Approval history fetched.');
    }

    public function export(Request $request, Response $response, array $user): void
    {
        $data = $this->approvals->getPendingApprovals(1, 1000, $this->filtersFromRequest($request))['data'] ?? [];
        $csv = $this->csv->exportApprovals($data);

        $response->header('Content-Type', 'text/csv');
        $response->header('Content-Disposition', 'attachment; filename="approvals.csv"');
        $response->raw($csv);
    }

    public function exportHistory(Request $request, Response $response, array $user): void
    {
        $filters = $this->filtersFromRequest($request);
        if ($request->query('action')) {
            $filters['action'] = $request->query('action');
        }
        if ($request->query('status') && $request->query('status') !== 'all') {
            $filters['action'] = strtolower((string) $request->query('status'));
        }
        if ($request->query('user_id')) {
            $filters['user_id'] = (int) $request->query('user_id');
        }

        $data = $this->approvals->getApprovalHistory(1, 1000, $filters)['data'] ?? [];
        $csv = $this->csv->exportApprovalHistory($data);

        $response->header('Content-Type', 'text/csv');
        $response->header('Content-Disposition', 'attachment; filename="approval-history.csv"');
        $response->raw($csv);
    }

    private function filtersFromRequest(Request $request): array
    {
        $filters = [];

        foreach (['search', 'member_type', 'payment_status', 'min_plan_cost', 'max_plan_cost', 'from_date', 'to_date'] as $key) {
            $value = $request->query($key);
            if ($value !== null && $value !== '') {
                $filters[$key] = $value;
            }
        }

        return $filters;
    }
}

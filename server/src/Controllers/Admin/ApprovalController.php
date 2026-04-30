<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use RuntimeException;
use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\ApprovalService;

final class ApprovalController extends BaseController
{
    private ApprovalService $approvals;

    public function __construct(?ApprovalService $approvals = null)
    {
        $this->approvals = $approvals ?? new ApprovalService();
    }

    public function index(Request $request, Response $response, array $user): void
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));

        $result = $this->approvals->getPendingApprovals($page, $perPage);
        $this->ok($response, $result, 'Pending approvals fetched.');
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
            $this->ok($response, null, 'Member rejected.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function history(Request $request, Response $response, array $user): void
    {
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(100, (int) $request->query('per_page', 20)));
        $filters = [];

        if ($request->query('action')) {
            $filters['action'] = $request->query('action');
        }

        if ($request->query('user_id')) {
            $filters['user_id'] = (int) $request->query('user_id');
        }

        $result = $this->approvals->getApprovalHistory($page, $perPage, $filters);
        $this->ok($response, $result, 'Approval history fetched.');
    }
}
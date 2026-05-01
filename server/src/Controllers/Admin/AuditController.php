<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Core\AppContext;

final class AuditController extends BaseController
{
    public function index(Request $request, Response $response, array $user): void
    {
        $limit = min(100, max(1, (int) ($request->query('limit', 50))));
        $logs = AppContext::database()->select(
            "SELECT al.*, u.name AS user_name FROM audit_logs AS al LEFT JOIN users AS u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT {$limit}"
        );

        $this->ok($response, ['logs' => $logs], 'Audit logs fetched.');
    }
}

<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Member;

use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\NotificationService;

final class NotificationController extends BaseController
{
    public function __construct(private readonly NotificationService $notifications = new NotificationService())
    {
    }

    public function index(Request $request, Response $response, array $user): void
    {
        $userId = (int) ($user['id'] ?? 0);
        $limit = (int) ($request->query('limit') ?? 10);
        $limit = max(1, min(50, $limit));

        $this->ok($response, [
            'notifications' => $userId > 0 ? $this->notifications->latestForUser($userId, $limit) : [],
        ], 'Member notifications fetched.');
    }
}


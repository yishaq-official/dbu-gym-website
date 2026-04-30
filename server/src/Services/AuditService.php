<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Models\AuditLog;

final class AuditService
{
    private AuditLog $audit;

    public function __construct(?AuditLog $audit = null)
    {
        $this->audit = $audit ?? new AuditLog();
    }

    public function log(string $action, ?int $userId = null, ?array $details = null, ?string $ip = null, ?string $userAgent = null): void
    {
        $this->audit->create([
            'user_id' => $userId,
            'action' => $action,
            'details' => $details,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
        ]);
    }
}
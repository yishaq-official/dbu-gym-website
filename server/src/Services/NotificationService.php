<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Models\Notification;

final class NotificationService
{
    private Notification $notifications;

    public function __construct(?Notification $notifications = null)
    {
        $this->notifications = $notifications ?? new Notification();
    }

    public function latestForUser(int $userId, int $limit = 10): array
    {
        return $this->format($this->notifications->latestByUserId($userId, $limit));
    }

    public function maybeCreateExpiryNotification(int $userId, ?int $remainingDays, ?string $expiryDate): void
    {
        if (!is_int($remainingDays)) {
            return;
        }

        if ($remainingDays >= 0 && $remainingDays <= 5) {
            $type = 'payment_expiry';
            if ($this->notifications->existsRecentByType($userId, $type, 24)) {
                return;
            }

            $this->notifications->create([
                'user_id' => $userId,
                'type' => $type,
                'content' => "Your membership expires in {$remainingDays} day" . ($remainingDays === 1 ? '' : 's') . '.',
                'sent_datetime' => date('Y-m-d H:i:s'),
            ]);
            return;
        }

        if ($remainingDays < 0) {
            $type = 'payment_expired';
            if ($this->notifications->existsRecentByType($userId, $type, 24)) {
                return;
            }

            $this->notifications->create([
                'user_id' => $userId,
                'type' => $type,
                'content' => 'Your membership has expired. Renew to continue access.',
                'sent_datetime' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    private function format(array $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            $type = (string) ($row['type'] ?? '');
            $severity = $type === 'payment_expired' ? 'danger' : ($type === 'payment_expiry' ? 'warning' : 'info');

            $out[] = [
                'id' => isset($row['id']) ? (int) $row['id'] : null,
                'type' => $type !== '' ? $type : null,
                'severity' => $severity,
                'message' => $row['content'] ?? null,
                'sent_datetime' => $row['sent_datetime'] ?? null,
            ];
        }

        return $out;
    }
}


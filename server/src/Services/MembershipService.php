<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Models\Membership;

final class MembershipService
{
    private Membership $memberships;

    public function __construct(?Membership $memberships = null)
    {
        $this->memberships = $memberships ?? new Membership();
    }

    public function findLatestByUserId(int $userId): ?array
    {
        return $this->memberships->findLatestByUserId($userId);
    }

    public function findLatestPaidByUserId(int $userId): ?array
    {
        return $this->memberships->findLatestPaidByUserId($userId);
    }

    public function create(array $payload): array
    {
        $id = $this->memberships->create($payload);
        return $this->memberships->findById($id) ?? [];
    }

    public function markPaymentPaid(int $id, string $membershipType): array
    {
        $startAt = date('Y-m-d H:i:s');
        $expiresAt = date('Y-m-d H:i:s', strtotime('+' . $this->durationMonths($membershipType) . ' months'));
        $this->memberships->markPaymentPaid($id, $startAt, $expiresAt);

        return $this->memberships->findById($id) ?? [];
    }

    public function markPaymentFailed(int $id): void
    {
        $this->memberships->markPaymentFailed($id);
    }

    public function findById(int $id): ?array
    {
        return $this->memberships->findById($id);
    }

    public function createRenewal(int $userId, string $membershipType, float $planCost, string $currency = 'ETB'): array
    {
        $id = $this->memberships->create([
            'user_id' => $userId,
            'membership_type' => $membershipType,
            'plan_cost' => $planCost,
            'currency' => $currency,
            'membership_status' => 'pending',
            'payment_status' => 'pending',
        ]);

        return $this->memberships->findById($id) ?? [];
    }

    private function durationMonths(string $membershipType): int
    {
        return match (strtolower($membershipType)) {
            '3months' => 3,
            '6months' => 6,
            '1year' => 12,
            default => 1,
        };
    }
}

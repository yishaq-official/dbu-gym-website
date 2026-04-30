<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Contracts\Services\PaymentServiceInterface;
use Yishaq\Server\Models\PaymentTransaction;

final class PaymentService implements PaymentServiceInterface
{
    private PaymentTransaction $transactions;

    public function __construct(?PaymentTransaction $transactions = null)
    {
        $this->transactions = $transactions ?? new PaymentTransaction();
    }

    public function findByTxRef(string $txRef): ?array
    {
        return $this->transactions->findByTxRef($txRef);
    }

    public function createPending(array $payload): array
    {
        $id = $this->transactions->create($payload);
        return $this->transactions->findByTxRef((string) $payload['tx_ref']) ?? ['id' => $id];
    }

    public function markSuccess(string $txRef, array $gatewayResponse = []): void
    {
        $this->transactions->markAsSuccess($txRef, $gatewayResponse);
    }

    public function markFailed(string $txRef, ?string $reason = null, array $gatewayResponse = []): void
    {
        $this->transactions->markAsFailed($txRef, $reason, $gatewayResponse);
    }
}

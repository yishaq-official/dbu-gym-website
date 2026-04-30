<?php

declare(strict_types=1);

namespace Yishaq\Server\Contracts\Services;

interface PaymentServiceInterface
{
    public function findByTxRef(string $txRef): ?array;

    public function createPending(array $payload): array;

    public function markSuccess(string $txRef, array $gatewayResponse = []): void;

    public function markFailed(string $txRef, ?string $reason = null, array $gatewayResponse = []): void;
}

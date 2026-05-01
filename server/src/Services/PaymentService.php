<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Contracts\Services\PaymentServiceInterface;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Exceptions\ValidationException;
use Yishaq\Server\Models\PaymentTransaction;
use Yishaq\Server\Validators\AuthValidator;
use Yishaq\Server\Validators\PaymentValidator;

final class PaymentService implements PaymentServiceInterface
{
    private PaymentTransaction $transactions;
    private ChapaClient $chapa;
    private AuthService $auth;
    private MembershipService $memberships;
    private UserService $users;

    public function __construct(
        ?PaymentTransaction $transactions = null,
        ?ChapaClient $chapa = null,
        ?AuthService $auth = null,
        ?MembershipService $memberships = null,
        ?UserService $users = null
    ) {
        $this->transactions = $transactions ?? new PaymentTransaction();
        $this->chapa = $chapa ?? new ChapaClient();
        $this->auth = $auth ?? new AuthService();
        $this->memberships = $memberships ?? new MembershipService();
        $this->users = $users ?? new UserService();
    }

    public function initializeChapaPayment(array $payload): array
    {
        $validator = new PaymentValidator();
        $errors = $validator->validateInitialize($payload);

        $email = strtolower(trim((string) ($payload['email'] ?? '')));
        $isRenewal = !empty($payload['renewal']) || !empty($payload['is_renewal']);
        $existingUser = $email !== '' ? $this->users->findByEmail($email) : null;

        if (!$existingUser || !$isRenewal) {
            $errors = array_merge(
                $errors,
                (new AuthValidator(max(8, (int) AppContext::config()->get('auth.password.min_length', 8))))->validateRegister($payload)
            );
        }

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $membershipType = $validator->normalizeMembershipType(
            (string) ($payload['membership_type'] ?? $payload['membership_plan'] ?? '')
        );
        $memberType = strtolower((string) ($payload['member_type'] ?? 'university'));
        $amount = $this->resolvePlanCost($membershipType, $memberType);
        $currency = (string) AppContext::config()->get('chapa.currency', 'ETB');
        $txRef = $this->generateTxRef();
        $returnUrl = (string) ($payload['return_url'] ?? '');
        if ($returnUrl === '') {
            $frontendUrl = rtrim((string) AppContext::config()->get('services.frontend_url', ''), '/');
            $returnUrl = $frontendUrl !== '' ? $frontendUrl . '/payments/chapa/return' : '';
        }
        $callbackUrl = trim((string) AppContext::config()->get('chapa.webhook_url', ''));

        $registrationPayload = $payload;
        $registrationPayload['membership_type'] = $membershipType;
        $registrationPayload['member_type'] = $memberType;
        unset($registrationPayload['return_url'], $registrationPayload['callback_url'], $registrationPayload['membership_plan']);

        $pendingPayload = [
            'tx_ref' => $txRef,
            'status' => 'pending',
            'amount' => $amount,
            'currency' => $currency,
            'email' => $email,
            'registration_payload' => $registrationPayload,
        ];

        if ($existingUser && $isRenewal) {
            $pendingPayload['user_id'] = (int) $existingUser['id'];
            $membership = $this->memberships->createRenewal(
                (int) $existingUser['id'],
                $membershipType,
                $amount,
                $currency
            );
            if (!empty($membership['id'])) {
                $pendingPayload['membership_id'] = (int) $membership['id'];
            }
        }

        $this->createPending($pendingPayload);

        $names = $this->splitName((string) $payload['name']);
        $phoneNumber = $this->chapaPhoneNumber((string) ($payload['phone'] ?? ''));
        $chapaPayload = [
            'amount' => (string) $amount,
            'currency' => $currency,
            'email' => $email,
            'first_name' => $names['first_name'],
            'last_name' => $names['last_name'],
            'tx_ref' => $txRef,
            'customization' => [
                'title' => 'DBU Membership',
                'description' => $isRenewal ? 'Membership renewal payment' : 'Membership registration payment',
            ],
        ];

        if ($phoneNumber !== '') {
            $chapaPayload['phone_number'] = $phoneNumber;
        }

        if ($returnUrl !== '') {
            $chapaPayload['return_url'] = $this->appendTxRef($returnUrl, $txRef);
        }

        if ($callbackUrl !== '' && filter_var($callbackUrl, FILTER_VALIDATE_URL)) {
            $chapaPayload['callback_url'] = $callbackUrl;
        }

        $gatewayResponse = $this->chapa->initialize($chapaPayload);
        $checkoutUrl = (string) ($gatewayResponse['data']['checkout_url'] ?? '');
        if ($checkoutUrl === '') {
            throw new RuntimeException('Missing Chapa checkout URL.');
        }

        $this->transactions->updateCheckoutUrl($txRef, $checkoutUrl);

        return [
            'tx_ref' => $txRef,
            'checkout_url' => $checkoutUrl,
            'amount' => $amount,
            'currency' => $currency,
            'status' => 'pending',
        ];
    }

    public function verifyChapaPayment(string $txRef): array
    {
        $txRef = trim($txRef);
        if ($txRef === '') {
            throw new RuntimeException('Missing transaction reference.');
        }

        $transaction = $this->findByTxRef($txRef);
        if (!$transaction) {
            throw new RuntimeException('Transaction not found.');
        }

        if (($transaction['status'] ?? '') === 'success') {
            return $this->transactionPayload($transaction, 'success');
        }

        $gatewayResponse = $this->chapa->verify($txRef);
        $status = $this->gatewayStatus($gatewayResponse);

        if ($status !== 'success') {
            $reason = (string) ($gatewayResponse['message'] ?? 'Payment verification failed.');
            if (in_array($status, ['cancelled', 'canceled'], true)) {
                $this->transactions->markAsCancelled($txRef, $reason, $gatewayResponse);
            } else {
                $this->markFailed($txRef, $reason, $gatewayResponse);
            }

            $transaction = $this->findByTxRef($txRef) ?? $transaction;
            if (!empty($transaction['membership_id'])) {
                $this->memberships->markPaymentFailed((int) $transaction['membership_id']);
            }

            return $this->transactionPayload($transaction, 'failed', $reason);
        }

        $registrationPayload = json_decode((string) ($transaction['registration_payload'] ?? ''), true);
        if (!is_array($registrationPayload)) {
            throw new RuntimeException('Transaction registration payload is missing.');
        }

        $email = strtolower(trim((string) ($registrationPayload['email'] ?? '')));
        $user = $this->users->findByEmail($email);

        if (!$user) {
            $registered = $this->auth->register($registrationPayload);
            $user = $registered['user'] ?? null;
        }

        if (!is_array($user) || empty($user['id'])) {
            throw new RuntimeException('Unable to create paid member account.');
        }

        $userId = (int) $user['id'];
        $membership = null;
        if (!empty($transaction['membership_id'])) {
            $membership = $this->memberships->findById((int) $transaction['membership_id']);
        }

        if (!$membership) {
            $membership = $this->memberships->findLatestByUserId($userId);
        }

        if (!$membership || empty($membership['id'])) {
            throw new RuntimeException('Unable to locate member membership.');
        }

        $membership = $this->memberships->markPaymentPaid(
            (int) $membership['id'],
            (string) ($registrationPayload['membership_type'] ?? ($membership['membership_type'] ?? 'monthly'))
        );

        $this->markSuccess($txRef, $gatewayResponse);
        $this->transactions->linkUserAndMembership($txRef, $userId, (int) $membership['id']);

        $updated = $this->findByTxRef($txRef) ?? $transaction;
        return $this->transactionPayload($updated, 'success', null, $membership);
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

    private function resolvePlanCost(string $membershipType, string $memberType): float
    {
        $prices = [
            'strength-training' => 400.0,
            'cardio-training' => 500.0,
            'aerobics-training' => 500.0,
            'vip-training' => 1000.0,
            'monthly' => 300.0,
            '3months' => 800.0,
            '6months' => 1500.0,
            '1year' => 2500.0,
        ];

        $base = $prices[$membershipType] ?? 300.0;
        return $memberType === 'university' ? round($base * 0.8, 2) : $base;
    }

    private function generateTxRef(): string
    {
        return 'DBUGYM-' . date('YmdHis') . '-' . bin2hex(random_bytes(4));
    }

    private function splitName(string $name): array
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $first = (string) ($parts[0] ?? 'Member');
        $last = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : 'DBU';

        return [
            'first_name' => $first,
            'last_name' => $last,
        ];
    }

    private function chapaPhoneNumber(string $phone): string
    {
        $normalized = preg_replace('/\s+/', '', trim($phone)) ?? '';

        if (preg_match('/^\+251([97]\d{8})$/', $normalized, $matches) === 1) {
            return '0' . $matches[1];
        }

        if (preg_match('/^0[97]\d{8}$/', $normalized) === 1) {
            return $normalized;
        }

        return '';
    }

    private function appendTxRef(string $url, string $txRef): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';
        return $url . $separator . 'tx_ref=' . rawurlencode($txRef);
    }

    private function gatewayStatus(array $gatewayResponse): string
    {
        $status = strtolower((string) ($gatewayResponse['status'] ?? $gatewayResponse['data']['status'] ?? ''));
        if ($status === 'success') {
            return 'success';
        }

        return $status !== '' ? $status : 'failed';
    }

    private function transactionPayload(
        array $transaction,
        string $status,
        ?string $failureReason = null,
        ?array $membership = null
    ): array {
        $payload = [
            'tx_ref' => $transaction['tx_ref'] ?? null,
            'status' => $status,
            'amount' => isset($transaction['amount']) ? (float) $transaction['amount'] : null,
            'currency' => $transaction['currency'] ?? null,
            'user_id' => isset($transaction['user_id']) ? (int) $transaction['user_id'] : null,
            'membership_id' => isset($transaction['membership_id']) ? (int) $transaction['membership_id'] : null,
        ];

        if ($failureReason !== null) {
            $payload['failure_reason'] = $failureReason;
        }

        if ($membership !== null) {
            $payload['membership'] = $membership;
        }

        return $payload;
    }
}

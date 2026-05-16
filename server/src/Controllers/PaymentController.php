<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers;

use RuntimeException;
use Throwable;
use Yishaq\Server\Contracts\Services\PaymentServiceInterface;
use Yishaq\Server\Core\Exceptions\HttpException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\PaymentService;
use Yishaq\Server\Services\RateLimiterService;

final class PaymentController extends BaseController
{
    private PaymentServiceInterface $payments;
    private RateLimiterService $rateLimiter;

    public function __construct(?PaymentServiceInterface $payments = null, ?RateLimiterService $rateLimiter = null)
    {
        $this->payments = $payments ?? new PaymentService();
        $this->rateLimiter = $rateLimiter ?? new RateLimiterService();
    }

    public function initializeChapa(Request $request, Response $response): void
    {
        $payload = $request->json();
        $isRenewal = !empty($payload['renewal']) || !empty($payload['is_renewal']);
        $this->rateLimiter->hit(
            $isRenewal ? 'payment_renewal_initialize' : 'payment_registration_initialize',
            $request,
            $isRenewal ? 10 : 5,
            $isRenewal ? 900 : 3600,
            (string) ($payload['email'] ?? '')
        );

        try {
            $result = $this->payments->initializeChapaPayment($payload);
            $this->created($response, $result, 'Payment initialized.');
        } catch (HttpException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 502);
        } catch (Throwable $exception) {
            throw new HttpException('Payment initialization failed: ' . $exception->getMessage(), 502);
        }
    }

    public function verifyChapa(Request $request, Response $response, array $params = []): void
    {
        $txRef = (string) ($params['tx_ref'] ?? '');

        try {
            $result = $this->payments->verifyChapaPayment($txRef);
            $this->ok($response, $result, 'Payment verification completed.');
        } catch (HttpException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            $message = $exception->getMessage();
            $status = str_contains(strtolower($message), 'not found') ? 404 : 422;
            throw new HttpException($message, $status);
        } catch (Throwable $exception) {
            throw new HttpException('Payment verification failed: ' . $exception->getMessage(), 422);
        }
    }

    public function chapaCallback(Request $request, Response $response): void
    {
        $payload = $request->input();
        $txRef = (string) ($payload['tx_ref'] ?? $payload['trx_ref'] ?? '');

        try {
            $result = $this->payments->verifyChapaPayment($txRef);
            $this->ok($response, $result, 'Payment callback processed.');
        } catch (HttpException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 422);
        } catch (Throwable $exception) {
            throw new HttpException('Payment callback failed: ' . $exception->getMessage(), 422);
        }
    }
}

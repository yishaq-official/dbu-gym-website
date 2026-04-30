<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers;

use RuntimeException;
use Yishaq\Server\Contracts\Services\PaymentServiceInterface;
use Yishaq\Server\Core\Exceptions\HttpException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\PaymentService;

final class PaymentController extends BaseController
{
    private PaymentServiceInterface $payments;

    public function __construct(?PaymentServiceInterface $payments = null)
    {
        $this->payments = $payments ?? new PaymentService();
    }

    public function initializeChapa(Request $request, Response $response): void
    {
        try {
            $result = $this->payments->initializeChapaPayment($request->json());
            $this->created($response, $result, 'Payment initialized.');
        } catch (HttpException $exception) {
            throw $exception;
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 502);
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
        }
    }
}

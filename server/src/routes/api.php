<?php

declare(strict_types=1);

use Yishaq\Server\Controllers\AuthController;
use Yishaq\Server\Controllers\EquipmentController;
use Yishaq\Server\Controllers\PaymentController;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Exceptions\HttpException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;

$router->get('/health', static function (Request $request, Response $response): void {
    $response->json(
        [
            'success' => true,
            'message' => 'Server is healthy',
            'data' => [
                'app' => 'reactbank-server',
                'timestamp' => date(DATE_ATOM),
                'method' => $request->method(),
            ],
        ],
        200
    );
});

$router->get('/health/db', static function (Request $request, Response $response): void {
    try {
        AppContext::database()->ping();
    } catch (\Throwable $exception) {
        throw new HttpException('Database is unreachable: ' . $exception->getMessage(), 503);
    }

    $response->json(
        [
            'success' => true,
            'message' => 'Database connection is healthy',
            'data' => [
                'driver' => 'mysql',
                'timestamp' => date(DATE_ATOM),
                'method' => $request->method(),
            ],
        ],
        200
    );
});

$router->get('/api/equipment', static function (Request $request, Response $response): void {
    (new EquipmentController())->publicIndex($request, $response);
});

$router->post('/api/auth/register', static function (Request $request, Response $response): void {
    (new AuthController())->register($request, $response);
});

$router->post('/api/auth/login', static function (Request $request, Response $response): void {
    (new AuthController())->login($request, $response);
});

$router->get('/api/auth/me', static function (Request $request, Response $response): void {
    (new AuthController())->me($request, $response);
});

$router->post('/api/auth/logout', static function (Request $request, Response $response): void {
    (new AuthController())->logout($request, $response);
});

$router->post('/api/auth/forgot-password', static function (Request $request, Response $response): void {
    (new AuthController())->forgotPassword($request, $response);
});

$router->post('/api/auth/reset-password', static function (Request $request, Response $response): void {
    (new AuthController())->resetPassword($request, $response);
});

$router->get('/api/auth/google/redirect', static function (Request $request, Response $response): void {
    (new AuthController())->googleRedirect($request, $response);
});

$router->get('/api/auth/google/callback', static function (Request $request, Response $response): void {
    (new AuthController())->googleCallback($request, $response);
});

$router->post('/api/payments/chapa/initialize', static function (Request $request, Response $response): void {
    (new PaymentController())->initializeChapa($request, $response);
});

$router->get('/api/payments/chapa/verify/{tx_ref}', static function (Request $request, Response $response, array $params): void {
    (new PaymentController())->verifyChapa($request, $response, $params);
});

$router->get('/api/payments/chapa/callback', static function (Request $request, Response $response): void {
    (new PaymentController())->chapaCallback($request, $response);
});

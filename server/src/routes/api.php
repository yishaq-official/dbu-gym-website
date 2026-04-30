<?php

declare(strict_types=1);

use Yishaq\Server\Controllers\AuthController;
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
    $frontend = rtrim((string) AppContext::config()->get('services.frontend_url', 'http://localhost:5173'), '/');
    $response->redirect($frontend . '/login?oauth_error=google_callback_failed', 302);
});

$router->get('/api/auth/google/callback', static function (Request $request, Response $response): void {
    $frontend = rtrim((string) AppContext::config()->get('services.frontend_url', 'http://localhost:5173'), '/');
    $response->redirect($frontend . '/login?oauth_error=google_callback_failed', 302);
});

<?php

declare(strict_types=1);

use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Controllers\Member\DashboardController;
use Yishaq\Server\Controllers\Member\MembershipController;
use Yishaq\Server\Controllers\Member\NotificationController;
use Yishaq\Server\Controllers\Member\ProfileController;
use Yishaq\Server\Middleware\AuthMiddleware;
use Yishaq\Server\Middleware\RoleMiddleware;

if (!function_exists('memberRequireAuth')) {
    function memberRequireAuth(Request $request): array
    {
        $user = (new AuthMiddleware())->authenticate($request);
        return (new RoleMiddleware('member'))->authorize($user);
    }
}

$router->get('/api/member/dashboard', static function (Request $request, Response $response): void {
    $user = memberRequireAuth($request);
    (new DashboardController())->show($request, $response, $user);
});

$router->get('/api/member/notifications', static function (Request $request, Response $response): void {
    $user = memberRequireAuth($request);
    (new NotificationController())->index($request, $response, $user);
});

$router->get('/api/member/profile', static function (Request $request, Response $response): void {
    $user = memberRequireAuth($request);
    (new ProfileController())->show($request, $response, $user);
});

$router->put('/api/member/profile', static function (Request $request, Response $response): void {
    $user = memberRequireAuth($request);
    (new ProfileController())->update($request, $response, $user);
});

$router->post('/api/member/profile/avatar', static function (Request $request, Response $response): void {
    $user = memberRequireAuth($request);
    (new ProfileController())->avatar($request, $response, $user);
});

$router->put('/api/member/password', static function (Request $request, Response $response): void {
    $user = memberRequireAuth($request);
    (new ProfileController())->password($request, $response, $user);
});

$router->post('/api/member/renew', static function (Request $request, Response $response): void {
    $user = memberRequireAuth($request);
    (new MembershipController())->renew($request, $response, $user);
});

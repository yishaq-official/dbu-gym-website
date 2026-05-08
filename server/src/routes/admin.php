<?php

declare(strict_types=1);

use Yishaq\Server\Controllers\Admin\ApprovalController;
use Yishaq\Server\Controllers\Admin\DashboardController;
use Yishaq\Server\Controllers\Admin\MemberController;
use Yishaq\Server\Controllers\Admin\ProfileController;
use Yishaq\Server\Controllers\Admin\SettingsController;
use Yishaq\Server\Controllers\Admin\AuditController;
use Yishaq\Server\Controllers\EquipmentController;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Middleware\AuthMiddleware;
use Yishaq\Server\Middleware\RoleMiddleware;

if (!function_exists('adminRequireAuth')) {
    function adminRequireAuth(Request $request): array
    {
        $user = (new AuthMiddleware())->authenticate($request);
        return (new RoleMiddleware('admin'))->authorize($user);
    }
}

$router->get('/api/admin/dashboard', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new DashboardController())->show($request, $response, $user);
});

$router->get('/api/admin/members', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new MemberController())->index($request, $response, $user);
});

$router->post('/api/admin/members', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new MemberController())->create($request, $response, $user);
});

$router->put('/api/admin/members/{id}', static function (Request $request, Response $response, array $params): void {
    $user = adminRequireAuth($request);
    (new MemberController())->update($request, $response, $user, $params);
});

$router->patch('/api/admin/members/{id}/status', static function (Request $request, Response $response, array $params): void {
    $user = adminRequireAuth($request);
    (new MemberController())->updateStatus($request, $response, $user, $params);
});

$router->get('/api/admin/equipment', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new EquipmentController())->adminIndex($request, $response, $user);
});

$router->post('/api/admin/equipment', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new EquipmentController())->store($request, $response, $user);
});

$router->put('/api/admin/equipment/{id}', static function (Request $request, Response $response, array $params): void {
    $user = adminRequireAuth($request);
    (new EquipmentController())->update($request, $response, $user, $params);
});

$router->delete('/api/admin/equipment/{id}', static function (Request $request, Response $response, array $params): void {
    $user = adminRequireAuth($request);
    (new EquipmentController())->destroy($request, $response, $user, $params);
});

$router->get('/api/admin/approvals', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new ApprovalController())->index($request, $response, $user);
});

$router->post('/api/admin/approvals/{id}/approve', static function (Request $request, Response $response, array $params): void {
    $user = adminRequireAuth($request);
    (new ApprovalController())->approve($request, $response, $user, $params);
});

$router->post('/api/admin/approvals/{id}/reject', static function (Request $request, Response $response, array $params): void {
    $user = adminRequireAuth($request);
    (new ApprovalController())->reject($request, $response, $user, $params);
});

$router->get('/api/admin/approvals/history', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new ApprovalController())->history($request, $response, $user);
});

$router->get('/api/admin/approvals/export', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new ApprovalController())->export($request, $response, $user);
});

$router->get('/api/admin/approvals/history/export', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new ApprovalController())->exportHistory($request, $response, $user);
});

$router->get('/api/admin/profile', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new ProfileController())->show($request, $response, $user);
});

$router->put('/api/admin/profile', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new ProfileController())->update($request, $response, $user);
});

$router->put('/api/admin/password', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new ProfileController())->password($request, $response, $user);
});

$router->post('/api/admin/profile/avatar', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new ProfileController())->avatar($request, $response, $user);
});

$router->get('/api/admin/settings', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new SettingsController())->show($request, $response, $user);
});

$router->put('/api/admin/settings', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new SettingsController())->update($request, $response, $user);
});

$router->post('/api/admin/settings/logo', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new SettingsController())->logo($request, $response, $user);
});

$router->post('/api/admin/settings/backup', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new SettingsController())->triggerBackup($request, $response, $user);
});

$router->get('/api/admin/settings/backup/download', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new SettingsController())->downloadBackup($request, $response, $user);
});

$router->get('/api/admin/audit', static function (Request $request, Response $response): void {
    $user = adminRequireAuth($request);
    (new AuditController())->index($request, $response, $user);
});

<?php

declare(strict_types=1);

use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Application;
use Yishaq\Server\Core\Config;
use Yishaq\Server\Core\Container;
use Yishaq\Server\Core\Env;
use Yishaq\Server\Core\ExceptionHandler;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Contracts\Services\AuthServiceInterface;
use Yishaq\Server\Contracts\Services\MemberServiceInterface;
use Yishaq\Server\Contracts\Services\PaymentServiceInterface;
use Yishaq\Server\Contracts\Services\SettingsServiceInterface;
use Yishaq\Server\Database;
use Yishaq\Server\Router;
use Yishaq\Server\Services\AuthService;
use Yishaq\Server\Services\MemberService;
use Yishaq\Server\Services\PaymentService;
use Yishaq\Server\Services\SettingsService;

$basePath = dirname(__DIR__);

Env::load($basePath);

$config = new Config($basePath . '/config');
AppContext::setConfig($config);

$timezone = (string) $config->get('app.timezone', 'Africa/Addis_Ababa');
date_default_timezone_set($timezone);

error_reporting(E_ALL);
ini_set('display_errors', $config->get('app.debug', false) ? '1' : '0');

$sessionPath = $basePath . '/storage/sessions';
if (!is_dir($sessionPath)) {
    @mkdir($sessionPath, 0775, true);
}

$canUseFileSession = is_dir($sessionPath) && is_writable($sessionPath);
if ($canUseFileSession) {
    session_save_path($sessionPath);
    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }
}

$publicStorage = $basePath . '/public/storage';
if (!is_dir($publicStorage) && !file_exists($publicStorage)) {
    @mkdir($publicStorage, 0775, true);
}

$defaultConnection = (string) $config->get('database.default', 'mysql');
$connection = $config->get('database.connections.' . $defaultConnection, []);
if (!is_array($connection) || $connection === []) {
    throw new RuntimeException('Database connection config not found: ' . $defaultConnection);
}

$database = new Database($connection);
AppContext::setDatabase($database);

$container = new Container();
$container->instance(Config::class, $config);
$container->instance(Database::class, $database);
$container->singleton(Request::class, static fn (): Request => Request::capture());
$container->singleton(Response::class, static fn (): Response => new Response());
$container->singleton(Router::class, static fn (): Router => new Router());
$container->singleton(ExceptionHandler::class, static fn (): ExceptionHandler => new ExceptionHandler());
$container->singleton(AuthServiceInterface::class, static fn (): AuthServiceInterface => new AuthService());
$container->singleton(MemberServiceInterface::class, static fn (): MemberServiceInterface => new MemberService());
$container->singleton(PaymentServiceInterface::class, static fn (): PaymentServiceInterface => new PaymentService());
$container->singleton(SettingsServiceInterface::class, static fn (): SettingsServiceInterface => new SettingsService());
$container->singleton(Application::class, static function (Container $c): Application {
    return new Application(
        $c->get(Request::class),
        $c->get(Response::class),
        $c->get(Router::class),
        $c->get(ExceptionHandler::class)
    );
});

AppContext::setContainer($container);

$globalHandler = static function (\Throwable $exception) use ($container): void {
    $handler = $container->get(ExceptionHandler::class);
    $request = $container->get(Request::class);
    $response = $container->get(Response::class);
    $handler->handle($exception, $request, $response);
};

set_exception_handler($globalHandler);

set_error_handler(static function (int $severity, string $message, string $file, int $line): bool {
    if (!(error_reporting() & $severity)) {
        return false;
    }

    throw new \ErrorException($message, 0, $severity, $file, $line);
});

register_shutdown_function(static function () use ($globalHandler): void {
    $error = error_get_last();
    if (!is_array($error)) {
        return;
    }

    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR];
    if (!in_array($error['type'] ?? null, $fatalTypes, true)) {
        return;
    }

    $globalHandler(new \ErrorException(
        (string) ($error['message'] ?? 'Fatal error'),
        0,
        (int) ($error['type'] ?? E_ERROR),
        (string) ($error['file'] ?? __FILE__),
        (int) ($error['line'] ?? 0)
    ));
});

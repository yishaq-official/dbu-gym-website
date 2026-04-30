<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

use Throwable;
use Yishaq\Server\Middleware\JsonMiddleware;
use Yishaq\Server\Router;

final class Application
{
    private Request $request;
    private Response $response;
    private Router $router;
    private ExceptionHandler $exceptionHandler;

    public function __construct(
        ?Request $request = null,
        ?Response $response = null,
        ?Router $router = null,
        ?ExceptionHandler $exceptionHandler = null
    ) {
        $this->request = $request ?? Request::capture();
        $this->response = $response ?? new Response();
        $this->router = $router ?? new Router();
        $this->exceptionHandler = $exceptionHandler ?? new ExceptionHandler();
        $this->registerRoutes();
    }

    public function run(): void
    {
        try {
            if ($this->request->isMethod('OPTIONS')) {
                $this->response->noContent(204);
                return;
            }

            (new JsonMiddleware())->handle($this->request);

            $dispatched = $this->router->dispatch($this->request, $this->response);
            if ($dispatched) {
                return;
            }

            $this->response->json(
                [
                    'success' => false,
                    'message' => 'Route not found',
                    'data' => [
                        'method' => $this->request->method(),
                        'path' => $this->request->path(),
                    ],
                ],
                404
            );
        } catch (Throwable $exception) {
            $this->exceptionHandler->handle($exception, $this->request, $this->response);
        }
    }

    private function registerRoutes(): void
    {
        $routeFiles = [
            __DIR__ . '/../routes/api.php',
            __DIR__ . '/../routes/admin.php',
            __DIR__ . '/../routes/member.php',
        ];

        foreach ($routeFiles as $routeFile) {
            if (!is_file($routeFile)) {
                continue;
            }

            $router = $this->router;
            require $routeFile;
        }
    }
}

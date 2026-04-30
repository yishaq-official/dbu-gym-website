<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

use Throwable;
use Yishaq\Server\Core\Exceptions\HttpException;

final class ExceptionHandler
{
    public function handle(Throwable $exception, Request $request, Response $response): void
    {
        if ($exception instanceof HttpException) {
            $payload = [
                'success' => false,
                'message' => $exception->getMessage(),
            ];

            if ($exception->errors() !== []) {
                $payload['errors'] = $exception->errors();
            }

            $response->json($payload, $exception->statusCode());
            return;
        }

        $payload = [
            'success' => false,
            'message' => 'Internal server error',
        ];

        if ($this->isDebug()) {
            $payload['debug'] = [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
                'path' => $request->path(),
                'method' => $request->method(),
            ];
        }

        $response->json($payload, 500);
    }

    private function isDebug(): bool
    {
        $value = $_ENV['APP_DEBUG'] ?? getenv('APP_DEBUG') ?: 'false';
        return filter_var($value, FILTER_VALIDATE_BOOL);
    }
}

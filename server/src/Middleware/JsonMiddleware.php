<?php

declare(strict_types=1);

namespace Yishaq\Server\Middleware;

use Yishaq\Server\Core\Exceptions\HttpException;
use Yishaq\Server\Core\Request;

final class JsonMiddleware
{
    /**
     * @var array<int, string>
     */
    private array $methodsWithBody = ['POST', 'PUT', 'PATCH'];

    public function handle(Request $request): void
    {
        if (!in_array($request->method(), $this->methodsWithBody, true)) {
            return;
        }

        if (trim($request->rawBody()) === '') {
            return;
        }

        $contentType = strtolower((string) $request->header('Content-Type', ''));
        if (str_contains($contentType, 'multipart/form-data')) {
            return;
        }

        if (!$request->isJson()) {
            throw new HttpException('Content-Type must be application/json.', 415);
        }

        json_decode($request->rawBody(), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new HttpException('Malformed JSON request body.', 400);
        }
    }

    public function __invoke(Request $request, callable $next): mixed
    {
        $this->handle($request);
        return $next($request);
    }
}

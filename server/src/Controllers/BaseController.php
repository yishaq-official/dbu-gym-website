<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers;

use Yishaq\Server\Core\Response;

abstract class BaseController
{
    protected function ok(
        Response $response,
        mixed $data = null,
        string $message = 'OK',
        array $meta = []
    ): void {
        $this->json($response, true, $message, $data, 200, [], $meta);
    }

    protected function created(
        Response $response,
        mixed $data = null,
        string $message = 'Created'
    ): void {
        $this->json($response, true, $message, $data, 201);
    }

    protected function accepted(
        Response $response,
        mixed $data = null,
        string $message = 'Accepted'
    ): void {
        $this->json($response, true, $message, $data, 202);
    }

    protected function noContent(Response $response): void
    {
        $response->noContent(204);
    }

    protected function error(
        Response $response,
        string $message = 'Request failed',
        int $status = 400,
        array $errors = []
    ): void {
        $this->json($response, false, $message, null, $status, $errors);
    }

    protected function unauthorized(Response $response, string $message = 'Unauthorized'): void
    {
        $this->error($response, $message, 401);
    }

    protected function forbidden(Response $response, string $message = 'Forbidden'): void
    {
        $this->error($response, $message, 403);
    }

    protected function notFound(Response $response, string $message = 'Not found'): void
    {
        $this->error($response, $message, 404);
    }

    protected function validationError(
        Response $response,
        array $errors,
        string $message = 'Validation failed'
    ): void {
        $this->error($response, $message, 422, $errors);
    }

    private function json(
        Response $response,
        bool $success,
        string $message,
        mixed $data,
        int $status,
        array $errors = [],
        array $meta = []
    ): void {
        $payload = [
            'success' => $success,
            'message' => $message,
        ];

        if ($data !== null) {
            $payload['data'] = $data;
        }

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        if ($meta !== []) {
            $payload['meta'] = $meta;
        }

        $response->json($payload, $status);
    }
}

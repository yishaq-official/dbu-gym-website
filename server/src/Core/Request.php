<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

final class Request
{
    private array $server;
    private array $query;
    private array $request;
    private array $files;
    private array $cookies;
    private array $headers;
    private string $rawBody;
    private ?array $jsonCache = null;

    public function __construct(
        array $server,
        array $query = [],
        array $request = [],
        array $files = [],
        array $cookies = [],
        ?string $rawBody = null
    ) {
        $this->server = $server;
        $this->query = $query;
        $this->request = $request;
        $this->files = $files;
        $this->cookies = $cookies;
        $this->headers = $this->extractHeaders($server);
        $this->rawBody = $rawBody ?? '';
    }

    public static function capture(): self
    {
        $rawBody = file_get_contents('php://input');

        return new self(
            $_SERVER,
            $_GET,
            $_POST,
            $_FILES,
            $_COOKIE,
            $rawBody === false ? '' : $rawBody
        );
    }

    public function method(): string
    {
        return strtoupper((string) ($this->server['REQUEST_METHOD'] ?? 'GET'));
    }

    public function uri(): string
    {
        return (string) ($this->server['REQUEST_URI'] ?? '/');
    }

    public function path(): string
    {
        $path = parse_url($this->uri(), PHP_URL_PATH) ?: '/';
        $scriptName = (string) ($this->server['SCRIPT_NAME'] ?? '');
        $scriptDir = trim(str_replace('\\', '/', dirname($scriptName)), '/');

        if ($scriptDir !== '' && $scriptDir !== '.' && str_starts_with($path, '/' . $scriptDir)) {
            $path = substr($path, strlen('/' . $scriptDir)) ?: '/';
        }

        $path = '/' . trim($path, '/');

        return $path === '//' ? '/' : $path;
    }

    public function isMethod(string $method): bool
    {
        return $this->method() === strtoupper($method);
    }

    public function query(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return $this->query;
        }

        return $this->query[$key] ?? $default;
    }

    public function input(?string $key = null, mixed $default = null): mixed
    {
        $payload = array_merge($this->json(), $this->request, $this->query);

        if ($key === null) {
            return $payload;
        }

        return $payload[$key] ?? $default;
    }

    public function json(?string $key = null, mixed $default = null): mixed
    {
        if ($this->jsonCache === null) {
            $decoded = json_decode($this->rawBody, true);
            $this->jsonCache = is_array($decoded) ? $decoded : [];
        }

        if ($key === null) {
            return $this->jsonCache;
        }

        return $this->jsonCache[$key] ?? $default;
    }

    public function header(string $name, mixed $default = null): mixed
    {
        $normalized = $this->normalizeHeaderName($name);

        return $this->headers[$normalized] ?? $default;
    }

    public function headers(): array
    {
        return $this->headers;
    }

    public function bearerToken(): ?string
    {
        $authorization = (string) $this->header('Authorization', '');
        if ($authorization === '') {
            $authorization = (string) ($this->server['HTTP_AUTHORIZATION'] ?? '');
        }
        if ($authorization === '') {
            $authorization = (string) ($this->server['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
        }
        if ($authorization === '') {
            return null;
        }

        if (preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches) !== 1) {
            return null;
        }

        return trim($matches[1]);
    }

    public function files(): array
    {
        return $this->files;
    }

    public function cookies(): array
    {
        return $this->cookies;
    }

    public function rawBody(): string
    {
        return $this->rawBody;
    }

    public function isJson(): bool
    {
        $contentType = strtolower((string) $this->header('Content-Type', ''));
        return str_contains($contentType, 'application/json');
    }

    private function extractHeaders(array $server): array
    {
        $headers = [];

        foreach ($server as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace('_', '-', substr($key, 5));
                $headers[$this->normalizeHeaderName($name)] = (string) $value;
                continue;
            }

            if (in_array($key, ['CONTENT_TYPE', 'CONTENT_LENGTH', 'CONTENT_MD5'], true)) {
                $name = str_replace('_', '-', $key);
                $headers[$this->normalizeHeaderName($name)] = (string) $value;
            }
        }

        if (!isset($headers['authorization'])) {
            $authorization = (string) ($server['HTTP_AUTHORIZATION'] ?? $server['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
            if ($authorization !== '') {
                $headers['authorization'] = $authorization;
            }
        }

        return $headers;
    }

    private function normalizeHeaderName(string $name): string
    {
        return strtolower(trim($name));
    }
}

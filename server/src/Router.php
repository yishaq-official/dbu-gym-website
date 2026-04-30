<?php

declare(strict_types=1);

namespace Yishaq\Server;

use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;

final class Router
{
    /**
     * @var array<int, array{method: string, path: string, pattern: string, handler: callable}>
     */
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function patch(string $path, callable $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    public function options(string $path, callable $handler): void
    {
        $this->add('OPTIONS', $path, $handler);
    }

    public function dispatch(Request $request, Response $response): bool
    {
        $method = $request->method();
        $path = $request->path();

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            if (!preg_match($route['pattern'], $path, $matches)) {
                continue;
            }

            $params = $this->extractParams($matches);
            ($route['handler'])($request, $response, $params);
            return true;
        }

        return false;
    }

    private function add(string $method, string $path, callable $handler): void
    {
        $normalizedPath = $this->normalizePath($path);
        $pattern = $this->compilePattern($normalizedPath);

        $this->routes[] = [
            'method' => strtoupper($method),
            'path' => $normalizedPath,
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    private function normalizePath(string $path): string
    {
        $normalized = '/' . trim($path, '/');
        return $normalized === '//' ? '/' : $normalized;
    }

    private function compilePattern(string $path): string
    {
        if ($path === '/') {
            return '#^/$#';
        }

        $regex = preg_replace('/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/', '(?P<$1>[^/]+)', $path);
        return '#^' . $regex . '$#';
    }

    /**
     * @param array<string|int, string> $matches
     * @return array<string, string>
     */
    private function extractParams(array $matches): array
    {
        $params = [];

        foreach ($matches as $key => $value) {
            if (is_string($key)) {
                $params[$key] = $value;
            }
        }

        return $params;
    }
}

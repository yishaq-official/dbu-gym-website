<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

final class Response
{
    private int $status = 200;
    private array $headers = [];
    private array $defaultHeaders = [
        'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
        'X-Content-Type-Options' => 'nosniff',
        'X-Frame-Options' => 'DENY',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'Permissions-Policy' => 'camera=(), microphone=(), geolocation=(), payment=()',
        'X-XSS-Protection' => '0',
    ];

    public function status(int $status): self
    {
        $this->status = $status;
        return $this;
    }

    public function header(string $name, string $value): self
    {
        $this->headers[$name] = $value;
        return $this;
    }

    public function json(array $payload, int $status = 200): void
    {
        $this->status($status);
        $this->header('Content-Type', 'application/json; charset=utf-8');
        $this->sendHeaders();
        echo json_encode(
            $payload,
            JSON_UNESCAPED_SLASHES
            | JSON_UNESCAPED_UNICODE
            | JSON_HEX_TAG
            | JSON_HEX_AMP
            | JSON_HEX_APOS
            | JSON_HEX_QUOT
        );
    }

    public function noContent(int $status = 204): void
    {
        $this->status($status);
        $this->sendHeaders();
    }

    public function redirect(string $url, int $status = 302): void
    {
        $this->status($status);
        $this->header('Location', $url);
        $this->sendHeaders();
    }

    public function raw(string $body, array $headers = [], int $status = 200): void
    {
        $this->status($status);

        foreach ($headers as $name => $value) {
            $this->header($name, $value);
        }

        $this->sendHeaders();
        echo $body;
    }

    private function sendHeaders(): void
    {
        http_response_code($this->status);

        foreach (array_merge($this->defaultHeaders, $this->headers) as $name => $value) {
            header($name . ': ' . $value);
        }
    }
}

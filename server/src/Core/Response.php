<?php

declare(strict_types=1);

namespace Yishaq\Server\Core;

final class Response
{
    private int $status = 200;
    private array $headers = [];

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
        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public function noContent(int $status = 204): void
    {
        $this->status($status);
        $this->sendHeaders();
    }

    private function sendHeaders(): void
    {
        http_response_code($this->status);

        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }
    }
}

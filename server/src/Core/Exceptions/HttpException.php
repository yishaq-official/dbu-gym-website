<?php

declare(strict_types=1);

namespace Yishaq\Server\Core\Exceptions;

use RuntimeException;

class HttpException extends RuntimeException
{
    private int $statusCode;
    private array $errors;

    public function __construct(
        string $message = 'HTTP error',
        int $statusCode = 500,
        array $errors = [],
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, 0, $previous);
        $this->statusCode = $statusCode;
        $this->errors = $errors;
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }

    public function errors(): array
    {
        return $this->errors;
    }
}

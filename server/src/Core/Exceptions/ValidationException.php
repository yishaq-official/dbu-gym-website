<?php

declare(strict_types=1);

namespace Yishaq\Server\Core\Exceptions;

final class ValidationException extends HttpException
{
    public function __construct(array $errors, string $message = 'Validation failed')
    {
        parent::__construct($message, 422, $errors);
    }
}

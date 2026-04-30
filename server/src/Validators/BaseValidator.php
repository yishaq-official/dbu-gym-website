<?php

declare(strict_types=1);

namespace Yishaq\Server\Validators;

use Yishaq\Server\Core\Exceptions\ValidationException;

abstract class BaseValidator
{
    /**
     * @return array<string, string>
     */
    abstract public function validate(array $payload): array;

    public function validateOrFail(array $payload): void
    {
        $errors = $this->validate($payload);
        if ($errors !== []) {
            throw new ValidationException($errors);
        }
    }

    protected function required(array $payload, string $field, string $label): ?string
    {
        $value = $payload[$field] ?? null;
        if ($value === null || trim((string) $value) === '') {
            return $label . ' is required.';
        }

        return null;
    }
}

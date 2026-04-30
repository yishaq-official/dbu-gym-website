<?php

declare(strict_types=1);

namespace Yishaq\Server\Validators;

use Yishaq\Server\Core\AppContext;

final class AuthValidator extends BaseValidator
{
    public function __construct(private readonly int $passwordMinLength = 8)
    {
    }

    public function validate(array $payload): array
    {
        return $this->validateLogin($payload);
    }

    public function validateRegister(array $payload): array
    {
        $errors = [];

        foreach (['name' => 'Name', 'email' => 'Email', 'password' => 'Password'] as $field => $label) {
            $error = $this->required($payload, $field, $label);
            if ($error !== null) {
                $errors[$field] = $error;
            }
        }

        if (!empty($payload['email']) && !filter_var((string) $payload['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email format is invalid.';
        }

        $password = (string) ($payload['password'] ?? '');
        if ($password !== '' && strlen($password) < $this->passwordMinLength) {
            $errors['password'] = 'Password must be at least ' . $this->passwordMinLength . ' characters.';
        }

        if ($password !== (string) ($payload['password_confirmation'] ?? '')) {
            $errors['password_confirmation'] = 'Password confirmation does not match.';
        }

        return $errors;
    }

    public function validateLogin(array $payload): array
    {
        $errors = [];

        foreach (['email' => 'Email', 'password' => 'Password'] as $field => $label) {
            $error = $this->required($payload, $field, $label);
            if ($error !== null) {
                $errors[$field] = $error;
            }
        }

        if (!empty($payload['email']) && !filter_var((string) $payload['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email format is invalid.';
        }

        return $errors;
    }

    public function validateForgotPassword(array $payload): array
    {
        $errors = [];
        $error = $this->required($payload, 'email', 'Email');
        if ($error !== null) {
            $errors['email'] = $error;
        } elseif (!filter_var((string) $payload['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email format is invalid.';
        }

        return $errors;
    }

    public function validateResetPassword(array $payload): array
    {
        $errors = $this->validateForgotPassword($payload);

        foreach (['token' => 'Reset token', 'password' => 'Password'] as $field => $label) {
            $error = $this->required($payload, $field, $label);
            if ($error !== null) {
                $errors[$field] = $error;
            }
        }

        $password = (string) ($payload['password'] ?? '');
        if ($password !== '' && strlen($password) < $this->passwordMinLength) {
            $errors['password'] = 'Password must be at least ' . $this->passwordMinLength . ' characters.';
        }

        if ($password !== (string) ($payload['password_confirmation'] ?? '')) {
            $errors['password_confirmation'] = 'Password confirmation does not match.';
        }

        return $errors;
    }

    public function validatePassword(array $payload): array
    {
        $errors = [];

        foreach (['current_password' => 'Current password', 'password' => 'Password'] as $field => $label) {
            $error = $this->required($payload, $field, $label);
            if ($error !== null) {
                $errors[$field] = $error;
            }
        }

        $password = (string) ($payload['password'] ?? '');
        if ($password !== '' && strlen($password) < $this->passwordMinLength) {
            $errors['password'] = 'Password must be at least ' . $this->passwordMinLength . ' characters.';
        }

        // Get password settings from system settings
        $settings = AppContext::database()->first(
            "SELECT password_special_chars FROM system_settings WHERE id = 1 LIMIT 1"
        );

        if ($settings && (int) $settings['password_special_chars'] === 1) {
            // Simplified check for special characters
            if ($password !== '' && !preg_match('/[!@#$%^&*]/', $password)) {
                $errors['password'] = 'Password must contain at least one special character.';
            }
        }

        if ($password !== (string) ($payload['password_confirmation'] ?? '')) {
            $errors['password_confirmation'] = 'Password confirmation does not match.';
        }

        return $errors;
    }
}
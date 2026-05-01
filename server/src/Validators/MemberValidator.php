<?php

declare(strict_types=1);

namespace Yishaq\Server\Validators;

final class MemberValidator extends BaseValidator
{
    public function __construct(private readonly int $passwordMinLength = 8)
    {
    }

    public function validate(array $payload): array
    {
        return $this->validateProfile($payload);
    }

    public function validateProfile(array $payload): array
    {
        $errors = [];

        $name = trim((string) ($payload['name'] ?? ''));
        if ($name === '') {
            $errors['name'] = 'Name is required.';
        }

        $email = trim((string) ($payload['email'] ?? ''));
        if ($email === '') {
            $errors['email'] = 'Email is required.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email format is invalid.';
        }

        if ($email !== trim((string) ($payload['email_confirmation'] ?? $email))) {
            $errors['email_confirmation'] = 'Email confirmation does not match.';
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

        if ($password !== (string) ($payload['password_confirmation'] ?? '')) {
            $errors['password_confirmation'] = 'Password confirmation does not match.';
        }

        return $errors;
    }

    public function validateRenewal(array $payload): array
    {
        $plan = $this->normalizeMembershipType((string) ($payload['membership_type'] ?? ''));
        return $plan === '' ? ['membership_type' => 'Membership plan is invalid.'] : [];
    }

    public function normalizeMembershipType(string $value): string
    {
        $normalized = strtolower(str_replace([' ', '_', '-'], '', trim($value)));

        return match ($normalized) {
            'strengthtraining', 'strengthtrainingdubbell', 'strength' => 'strength-training',
            'cardiotraining', 'cardio' => 'cardio-training',
            'aerobicstraining', 'aerobics' => 'aerobics-training',
            'viptraining', 'vip' => 'vip-training',
            'monthly' => 'monthly',
            '3month', '3months' => '3months',
            '6month', '6months' => '6months',
            '1year', 'yearly', 'annual' => '1year',
            default => '',
        };
    }
}

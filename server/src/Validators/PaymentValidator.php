<?php

declare(strict_types=1);

namespace Yishaq\Server\Validators;

final class PaymentValidator extends BaseValidator
{
    public function validate(array $payload): array
    {
        return $this->validateInitialize($payload);
    }

    public function validateInitialize(array $payload): array
    {
        $errors = [];

        foreach (['name' => 'Name', 'email' => 'Email', 'phone' => 'Phone'] as $field => $label) {
            $error = $this->required($payload, $field, $label);
            if ($error !== null) {
                $errors[$field] = $error;
            }
        }

        if (!empty($payload['email']) && !filter_var((string) $payload['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email format is invalid.';
        }

        if ($this->normalizeMembershipType((string) ($payload['membership_type'] ?? $payload['membership_plan'] ?? '')) === '') {
            $errors['membership_type'] = 'Membership plan is invalid.';
        }

        $memberType = strtolower((string) ($payload['member_type'] ?? 'university'));
        if (!in_array($memberType, ['university', 'external'], true)) {
            $errors['member_type'] = 'Member type is invalid.';
        }

        return $errors;
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

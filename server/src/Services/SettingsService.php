<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use Yishaq\Server\Contracts\Services\SettingsServiceInterface;
use Yishaq\Server\Models\SystemSetting;

final class SettingsService implements SettingsServiceInterface
{
    private SystemSetting $settings;

    public function __construct(?SystemSetting $settings = null)
    {
        $this->settings = $settings ?? new SystemSetting();
    }

    public function get(): ?array
    {
        return $this->settings->getSingleton();
    }

    public function update(array $attributes): ?array
    {
        $attributes = $this->sanitizeAttributes($attributes);
        if ($attributes === []) {
            return $this->settings->getSingleton();
        }

        $this->settings->updateSingleton($attributes);
        return $this->settings->getSingleton();
    }

    private function sanitizeAttributes(array $payload): array
    {
        $allowed = [
            'system_name' => 'string',
            'language' => 'string',
            'timezone' => 'string',
            'maintenance_mode' => 'bool',
            'two_fa' => 'bool',
            'password_min_length' => 'int',
            'password_expiry_days' => 'int',
            'password_special_chars' => 'bool',
            'session_timeout' => 'int',
            'max_login_attempts' => 'int',
            'email_notifications' => 'bool',
            'sms_notifications' => 'bool',
            'sender_email' => 'email',
            'api_key' => 'string',
            'auto_backup' => 'bool',
            'backup_frequency' => 'frequency',
            'theme' => 'theme',
            'accent_color' => 'hex',
            'layout_style' => 'string',
        ];

        $attributes = [];
        foreach ($allowed as $key => $type) {
            if (!array_key_exists($key, $payload)) {
                continue;
            }

            $value = $payload[$key];
            switch ($type) {
                case 'bool':
                    $attributes[$key] = filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
                    break;
                case 'int':
                    $attributes[$key] = is_numeric($value) ? (int) $value : 0;
                    break;
                case 'hex':
                    if (is_string($value) && preg_match('/^#[0-9A-Fa-f]{6}$/', $value)) {
                        $attributes[$key] = $value;
                    }
                    break;
                case 'theme':
                    if (in_array($value, ['dark', 'light'], true)) {
                        $attributes[$key] = $value;
                    }
                    break;
                case 'frequency':
                    if (in_array($value, ['daily', 'weekly', 'monthly'], true)) {
                        $attributes[$key] = $value;
                    }
                    break;
                case 'email':
                    if (is_string($value) && filter_var(trim($value), FILTER_VALIDATE_EMAIL)) {
                        $attributes[$key] = trim($value);
                    }
                    break;
                case 'string':
                    if (is_string($value)) {
                        $attributes[$key] = trim($value);
                    }
                    break;
            }
        }

        return $attributes;
    }
}

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
        $this->settings->updateSingleton($attributes);
        return $this->settings->getSingleton();
    }
}

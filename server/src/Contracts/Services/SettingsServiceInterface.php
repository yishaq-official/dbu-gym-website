<?php

declare(strict_types=1);

namespace Yishaq\Server\Contracts\Services;

interface SettingsServiceInterface
{
    public function get(): ?array;

    public function update(array $attributes): ?array;
}

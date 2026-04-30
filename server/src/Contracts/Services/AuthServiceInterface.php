<?php

declare(strict_types=1);

namespace Yishaq\Server\Contracts\Services;

interface AuthServiceInterface
{
    public function register(array $payload): array;

    public function login(array $payload): array;

    public function me(int $userId): ?array;

    public function userIdFromRequestToken(string $token): ?int;
}

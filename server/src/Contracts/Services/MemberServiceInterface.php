<?php

declare(strict_types=1);

namespace Yishaq\Server\Contracts\Services;

interface MemberServiceInterface
{
    public function dashboard(array $user): array;

    public function profile(array $user): array;

    public function updateProfile(array $user, array $payload): array;

    public function updatePassword(array $user, array $payload): void;

    public function uploadAvatar(array $user, array $file): array;

    public function renew(array $user, array $payload): array;
}

<?php

declare(strict_types=1);

namespace Yishaq\Server\Middleware;

use Yishaq\Server\Core\Exceptions\HttpException;

final class RoleMiddleware
{
    /**
     * @var array<int, string>
     */
    private array $roles;

    public function __construct(string|array $roles)
    {
        $this->roles = array_values(array_map('strval', (array) $roles));
    }

    public function authorize(array $user): array
    {
        if (!in_array((string) ($user['role'] ?? ''), $this->roles, true)) {
            throw new HttpException('Forbidden.', 403);
        }

        return $user;
    }

    public function __invoke(array $user, callable $next): mixed
    {
        return $next($this->authorize($user));
    }
}

<?php

declare(strict_types=1);

namespace Yishaq\Server\Middleware;

use Yishaq\Server\Contracts\Services\AuthServiceInterface;
use Yishaq\Server\Core\Exceptions\HttpException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Services\AuthService;

final class AuthMiddleware
{
    private AuthServiceInterface $auth;

    public function __construct(?AuthServiceInterface $auth = null)
    {
        $this->auth = $auth ?? new AuthService();
    }

    public function authenticate(Request $request): array
    {
        $token = $request->bearerToken();
        if (!$token) {
            throw new HttpException('Missing bearer token.', 401);
        }

        $userId = $this->auth->userIdFromRequestToken($token);
        if (!$userId) {
            throw new HttpException('Invalid or expired token.', 401);
        }

        $user = $this->auth->me($userId);
        if (!$user) {
            throw new HttpException('User not found.', 404);
        }

        return $user;
    }

    public function __invoke(Request $request, callable $next): mixed
    {
        return $next($request, $this->authenticate($request));
    }
}

<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers;

use RuntimeException;
use Yishaq\Server\Contracts\Services\AuthServiceInterface;
use Yishaq\Server\Core\Exceptions\HttpException;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\AuthService;

final class AuthController extends BaseController
{
    private AuthServiceInterface $auth;

    public function __construct(?AuthServiceInterface $auth = null)
    {
        $this->auth = $auth ?? new AuthService();
    }

    public function register(Request $request, Response $response): void
    {
        try {
            $result = $this->auth->register($request->json());
            $this->created($response, $result, 'Registration successful.');
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 422);
        }
    }

    public function login(Request $request, Response $response): void
    {
        try {
            $result = $this->auth->login($request->json());
            $this->ok($response, $result, 'Login successful.');
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 401);
        }
    }

    public function me(Request $request, Response $response): void
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

        $this->ok($response, ['user' => $user], 'Authenticated user fetched.');
    }
}

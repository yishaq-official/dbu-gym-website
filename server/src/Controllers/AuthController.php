<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers;

use RuntimeException;
use Yishaq\Server\Contracts\Services\AuthServiceInterface;
use Yishaq\Server\Core\AppContext;
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

    public function googleRedirect(Request $request, Response $response): void
    {
        try {
            $response->redirect($this->auth->googleRedirectUrl(), 302);
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 422);
        }
    }

    public function googleCallback(Request $request, Response $response): void
    {
        $frontend = rtrim((string) AppContext::config()->get('services.frontend_url', 'http://localhost:5173'), '/');

        try {
            $result = $this->auth->loginWithGoogleCallback(
                (string) $request->query('code', ''),
                (string) $request->query('state', '')
            );

            $user = is_array($result['user'] ?? null) ? $result['user'] : [];
            $role = (string) ($user['role'] ?? 'member');
            $query = http_build_query([
                'oauth_token' => (string) ($result['token'] ?? ''),
                'oauth_role' => $role,
            ], '', '&', PHP_QUERY_RFC3986);

            $response->redirect($frontend . '/login?' . $query, 302);
        } catch (RuntimeException $exception) {
            $message = $exception->getMessage();
            $knownErrors = ['google_email_missing', 'account_not_found'];
            $error = in_array($message, $knownErrors, true) ? $message : 'google_callback_failed';
            $response->redirect($frontend . '/login?oauth_error=' . rawurlencode($error), 302);
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

    public function logout(Request $request, Response $response): void
    {
        $token = $request->bearerToken();
        if ($token) {
            $this->auth->logout($token);
        }

        $this->ok($response, null, 'Logout successful.');
    }

    public function forgotPassword(Request $request, Response $response): void
    {
        $result = $this->auth->requestPasswordReset($request->json());
        $this->ok(
            $response,
            $result,
            'If an account exists for that email, password reset instructions have been prepared.'
        );
    }

    public function resetPassword(Request $request, Response $response): void
    {
        try {
            $this->auth->resetPassword($request->json());
            $this->ok($response, null, 'Password reset successful.');
        } catch (RuntimeException $exception) {
            throw new HttpException($exception->getMessage(), 422);
        }
    }
}

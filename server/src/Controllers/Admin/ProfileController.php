<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use RuntimeException;
use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\UserService;
use Yishaq\Server\Services\FileService;

final class ProfileController extends BaseController
{
    private UserService $users;
    private FileService $files;

    public function __construct(?UserService $users = null, ?FileService $files = null)
    {
        $this->users = $users ?? new UserService();
        $this->files = $files ?? new FileService();
    }

    public function show(Request $request, Response $response, array $user): void
    {
        $this->ok($response, ['user' => $user], 'Admin profile fetched.');
    }

    public function update(Request $request, Response $response, array $user): void
    {
        try {
            $payload = $request->json();
            $updated = $this->users->updateProfile((int) $user['id'], $payload);
            $this->ok($response, ['user' => $updated], 'Profile updated.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function password(Request $request, Response $response, array $user): void
    {
        $payload = $request->json();

        $validator = new \Yishaq\Server\Validators\AuthValidator(max(8, (int) AppContext::config()->get('auth.password.min_length', 8)));
        $errors = $validator->validatePassword($payload);
        if ($errors !== []) {
            $this->error($response, implode(', ', $errors), 422);
            return;
        }

        try {
            $fresh = $this->users->findById((int) $user['id']);
            if (!$fresh || !password_verify((string) $payload['current_password'], (string) ($fresh['password'] ?? ''))) {
                $this->error($response, 'Current password is incorrect.', 422);
                return;
            }

            $hashedPassword = password_hash((string) $payload['password'], PASSWORD_DEFAULT);
            if ($hashedPassword === false) {
                $this->error($response, 'Failed to secure password.', 500);
                return;
            }

            $this->users->updatePasswordById((int) $user['id'], $hashedPassword);
            $this->ok($response, null, 'Password updated.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function avatar(Request $request, Response $response, array $user): void
    {
        $files = $request->files();
        $file = is_array($files['avatar'] ?? null) ? $files['avatar'] : null;
        if ($file === null) {
            $this->error($response, 'Avatar file is required.', 422);
            return;
        }

        try {
            $path = $this->files->storeAvatar($file);
            $updated = $this->users->updateProfile((int) $user['id'], ['avatar_path' => $path]);
            $this->ok($response, [
                'avatar_url' => $this->assetUrl($path),
                'user' => $updated,
            ], 'Avatar uploaded.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    private function assetUrl(string $path): string
    {
        $appUrl = rtrim((string) \Yishaq\Server\Core\AppContext::config()->get('app.url', ''), '/');
        return $appUrl !== '' ? $appUrl . '/' . ltrim($path, '/') : '/' . ltrim($path, '/');
    }
}
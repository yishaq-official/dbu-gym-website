<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use RuntimeException;
use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\UserService;
use Yishaq\Server\Services\FileService;
use Yishaq\Server\Services\AuditService;

final class ProfileController extends BaseController
{
    private UserService $users;
    private FileService $files;
    private AuditService $audit;

    public function __construct(?UserService $users = null, ?FileService $files = null, ?AuditService $audit = null)
    {
        $this->users = $users ?? new UserService();
        $this->files = $files ?? new FileService();
        $this->audit = $audit ?? new AuditService();
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
            $this->audit->log('update_admin_profile', (int) $user['id'], [
                'updated_fields' => array_keys($payload)
            ]);
            $this->ok($response, ['user' => $updated], 'Profile updated.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 422);
        }
    }

    public function password(Request $request, Response $response, array $user): void
    {
        $payload = $request->json();

        // Get password settings from system settings
        $settings = AppContext::database()->first(
            "SELECT password_min_length FROM system_settings WHERE id = 1 LIMIT 1"
        );
        $minLength = $settings ? (int) $settings['password_min_length'] : 8;

        $validator = new \Yishaq\Server\Validators\AuthValidator($minLength);
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
            $this->audit->log('change_admin_password', (int) $user['id']);
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
            $this->audit->log('upload_admin_avatar', (int) $user['id'], [
                'avatar_path' => $path
            ]);
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
        $appUrl = rtrim((string) AppContext::config()->get('app.url', ''), '/');
        return $appUrl !== '' ? $appUrl . '/' . ltrim($path, '/') : '/' . ltrim($path, '/');
    }
}
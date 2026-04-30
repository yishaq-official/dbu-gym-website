<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use RuntimeException;
use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\FileService;
use Yishaq\Server\Services\SettingsService;

final class SettingsController extends BaseController
{
    private SettingsService $settings;
    private FileService $files;

    public function __construct(?SettingsService $settings = null, ?FileService $files = null)
    {
        $this->settings = $settings ?? new SettingsService();
        $this->files = $files ?? new FileService();
    }

    public function show(Request $request, Response $response, array $user): void
    {
        $settings = $this->settings->get();
        if ($settings && isset($settings['logo_path'])) {
            $settings['logo_url'] = $this->assetUrl($settings['logo_path']);
        }
        $this->ok($response, ['settings' => $settings], 'Settings fetched.');
    }

    public function update(Request $request, Response $response, array $user): void
    {
        $payload = $request->json();
        $updated = $this->settings->update($payload);
        if ($updated && isset($updated['logo_path'])) {
            $updated['logo_url'] = $this->assetUrl($updated['logo_path']);
        }
        $this->ok($response, ['settings' => $updated], 'Settings updated.');
    }

    public function logo(Request $request, Response $response, array $user): void
    {
        $files = $request->files();
        $file = is_array($files['logo'] ?? null) ? $files['logo'] : null;
        if ($file === null) {
            $this->error($response, 'Logo file is required.', 422);
            return;
        }

        try {
            $path = $this->files->storeLogo($file);
            $updated = $this->settings->update(['logo_path' => $path]);
            if ($updated && isset($updated['logo_path'])) {
                $updated['logo_url'] = $this->assetUrl($updated['logo_path']);
            }
            $this->ok($response, [
                'logo_url' => $this->assetUrl($path),
                'settings' => $updated,
            ], 'Logo uploaded.');
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
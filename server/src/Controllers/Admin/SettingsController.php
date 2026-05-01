<?php

declare(strict_types=1);

namespace Yishaq\Server\Controllers\Admin;

use RuntimeException;
use Yishaq\Server\Controllers\BaseController;
use Yishaq\Server\Core\AppContext;
use Yishaq\Server\Core\Request;
use Yishaq\Server\Core\Response;
use Yishaq\Server\Services\BackupService;
use Yishaq\Server\Services\FileService;
use Yishaq\Server\Services\SettingsService;
use Yishaq\Server\Services\AuditService;

final class SettingsController extends BaseController
{
    private SettingsService $settings;
    private FileService $files;
    private AuditService $audit;
    private BackupService $backup;

    public function __construct(
        ?SettingsService $settings = null,
        ?FileService $files = null,
        ?AuditService $audit = null,
        ?BackupService $backup = null
    ) {
        $this->settings = $settings ?? new SettingsService();
        $this->files = $files ?? new FileService();
        $this->audit = $audit ?? new AuditService();
        $this->backup = $backup ?? new BackupService();
    }

    public function show(Request $request, Response $response, array $user): void
    {
        $settings = $this->settings->get();
        if ($settings && isset($settings['logo_path'])) {
            $settings['logo_url'] = $this->assetUrl($settings['logo_path']);
        }

        $backupPath = $this->backup->latestBackupFile();
        $backup = null;
        if ($backupPath !== null) {
            $backup = [
                'filename' => basename($backupPath),
                'created_at' => date(DATE_ATOM, filemtime($backupPath)),
                'url' => $this->assetUrl('storage/backups/' . basename($backupPath)),
            ];
        }

        $this->ok($response, ['settings' => $settings, 'backup' => $backup], 'Settings fetched.');
    }

    public function update(Request $request, Response $response, array $user): void
    {
        $payload = $request->json();
        $updated = $this->settings->update($payload);
        $this->audit->log('update_system_settings', (int) $user['id'], [
            'updated_fields' => array_keys($payload)
        ]);
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
            $this->audit->log('upload_system_logo', (int) $user['id'], [
                'logo_path' => $path
            ]);
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

    public function triggerBackup(Request $request, Response $response, array $user): void
    {
        try {
            $backupPath = $this->backup->createBackup();
            $backupFile = basename($backupPath);
            $this->audit->log('create_system_backup', (int) $user['id'], [
                'backup_file' => $backupFile,
            ]);
            $this->ok($response, [
                'backup_file' => $backupFile,
                'backup_url' => $this->assetUrl('storage/backups/' . $backupFile),
            ], 'Backup created successfully.');
        } catch (RuntimeException $exception) {
            $this->error($response, $exception->getMessage(), 500);
        }
    }

    public function downloadBackup(Request $request, Response $response, array $user): void
    {
        $backupFile = $this->backup->latestBackupFile();
        if ($backupFile === null) {
            $this->error($response, 'No backup file available.', 404);
            return;
        }

        $content = file_get_contents($backupFile);
        if ($content === false) {
            $this->error($response, 'Unable to read backup file.', 500);
            return;
        }

        $response->raw($content, [
            'Content-Type' => 'application/json; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . basename($backupFile) . '"',
        ]);
    }

    private function assetUrl(string $path): string
    {
        $appUrl = rtrim((string) AppContext::config()->get('app.url', ''), '/');
        return $appUrl !== '' ? $appUrl . '/' . ltrim($path, '/') : '/' . ltrim($path, '/');
    }
}
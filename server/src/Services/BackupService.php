<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Core\AppContext;

final class BackupService
{
    public function createBackup(): string
    {
        $backupData = $this->gatherBackupData();
        $payload = json_encode($backupData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);

        if ($payload === false) {
            throw new RuntimeException('Unable to encode backup payload.');
        }

        $backupDir = $this->getBackupDirectory();
        if (!is_dir($backupDir) && !mkdir($backupDir, 0775, true) && !is_dir($backupDir)) {
            throw new RuntimeException('Unable to prepare backup directory.');
        }

        $fileName = sprintf('dbugym-backup-%s.json', date('Ymd-His'));
        $filePath = $backupDir . DIRECTORY_SEPARATOR . $fileName;

        if (file_put_contents($filePath, $payload) === false) {
            throw new RuntimeException('Unable to write backup file.');
        }

        return $filePath;
    }

    public function latestBackupFile(): ?string
    {
        $backupDir = $this->getBackupDirectory();
        if (!is_dir($backupDir)) {
            return null;
        }

        $files = glob($backupDir . DIRECTORY_SEPARATOR . 'dbugym-backup-*.json');
        if ($files === false || $files === []) {
            return null;
        }

        usort($files, static fn(string $a, string $b): int => filemtime($b) <=> filemtime($a));
        return $files[0] ?? null;
    }

    private function gatherBackupData(): array
    {
        $db = AppContext::database();
        $tables = $db->select('SHOW TABLES');
        $tableNames = [];

        foreach ($tables as $row) {
            $name = current($row);
            if (!is_string($name) || $name === '') {
                continue;
            }

            if (!preg_match('/^[a-zA-Z0-9_]+$/', $name)) {
                continue;
            }

            $tableNames[] = $name;
        }

        $backup = [
            'created_at' => date(DATE_ATOM),
            'database' => (string) AppContext::config()->get('database.connections.' . AppContext::config()->get('database.default', 'mysql') . '.database', ''),
            'tables' => [],
        ];

        foreach ($tableNames as $tableName) {
            $backup['tables'][$tableName] = $db->select("SELECT * FROM `{$tableName}`");
        }

        return $backup;
    }

    private function getBackupDirectory(): string
    {
        $basePath = dirname(__DIR__, 2);
        return $basePath . '/public/storage/backups';
    }
}

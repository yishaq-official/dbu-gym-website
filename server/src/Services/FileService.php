<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Core\AppContext;

final class FileService
{
    /**
     * @param array<string, mixed> $file
     */
    public function storeAvatar(array $file): string
    {
        return $this->storeImage($file, (string) AppContext::config()->get('services.uploads.avatars_dir', 'storage/uploads/avatars'));
    }

    /**
     * @param array<string, mixed> $file
     */
    public function storeLogo(array $file): string
    {
        return $this->storeImage($file, (string) AppContext::config()->get('services.uploads.logos_dir', 'storage/uploads/logos'));
    }

    /**
     * @param array<string, mixed> $file
     */
    private function storeImage(array $file, string $relativeDir): string
    {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Upload failed.');
        }

        $tmpName = (string) ($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            throw new RuntimeException('Uploaded file is invalid.');
        }

        // Get max file size from settings (default 2MB)
        $db = AppContext::database();
        $settings = $db->first("SELECT * FROM system_settings WHERE id = 1 LIMIT 1");
        $maxSize = ($settings && isset($settings['max_file_size'])) ? (int) $settings['max_file_size'] * 1024 * 1024 : 2 * 1024 * 1024;

        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > $maxSize) {
            throw new RuntimeException('Image must be ' . ($maxSize / (1024 * 1024)) . 'MB or smaller.');
        }

        $mime = (string) (mime_content_type($tmpName) ?: '');
        $extension = match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            default => '',
        };

        if ($extension === '') {
            throw new RuntimeException('Only JPG, PNG, and WEBP images are allowed.');
        }

        // Additional security: check file content for malicious code
        $fileContent = file_get_contents($tmpName);
        if ($fileContent === false) {
            throw new RuntimeException('Unable to read uploaded file.');
        }

        // Check for PHP or script tags in the file content
        if (preg_match('/<\?php|<\?|script|eval|exec|system/i', $fileContent)) {
            throw new RuntimeException('Uploaded file contains potentially malicious content.');
        }

        // Sanitize original filename
        $originalName = (string) ($file['name'] ?? '');
        $sanitizedName = preg_replace('/[^a-zA-Z0-9\-_\.]/', '_', $originalName);
        if (strlen($sanitizedName) > 100) {
            $sanitizedName = substr($sanitizedName, 0, 100);
        }

        $basePath = dirname(__DIR__, 2);
        $relativeDir = trim($relativeDir, '/');
        if (str_starts_with($relativeDir, 'storage/')) {
            $targetDir = $basePath . '/public/' . $relativeDir;
        } else {
            $targetDir = $basePath . '/' . $relativeDir;
        }

        if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
            throw new RuntimeException('Unable to prepare upload directory.');
        }

        if (!is_dir($targetDir) || !is_writable($targetDir)) {
            throw new RuntimeException('Unable to prepare upload directory.');
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $targetPath = $targetDir . '/' . $filename;
        if (!@move_uploaded_file($tmpName, $targetPath)) {
            throw new RuntimeException('Unable to store uploaded image.');
        }

        // Set proper permissions
        @chmod($targetPath, 0644);

        return $relativeDir . '/' . $filename;
    }
}

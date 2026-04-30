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

        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > 2 * 1024 * 1024) {
            throw new RuntimeException('Image must be 2MB or smaller.');
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

        $basePath = dirname(__DIR__, 2);
        $relativeDir = trim($relativeDir, '/');
        $targetDir = $basePath . '/' . $relativeDir;
        if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
            throw new RuntimeException('Unable to prepare upload directory.');
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $targetPath = $targetDir . '/' . $filename;
        if (!move_uploaded_file($tmpName, $targetPath)) {
            throw new RuntimeException('Unable to store uploaded image.');
        }

        return $relativeDir . '/' . $filename;
    }
}

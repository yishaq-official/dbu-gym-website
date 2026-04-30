<?php

declare(strict_types=1);

namespace Yishaq\Server\Helpers;

use RuntimeException;

final class JwtHelper
{
    public function encode(array $payload, string $secret): string
    {
        if ($secret === '') {
            throw new RuntimeException('JWT secret is not configured.');
        }

        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT',
        ];

        $segments = [
            $this->base64UrlEncode((string) json_encode($header, JSON_UNESCAPED_SLASHES)),
            $this->base64UrlEncode((string) json_encode($payload, JSON_UNESCAPED_SLASHES)),
        ];

        $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = $this->base64UrlEncode($signature);

        return implode('.', $segments);
    }

    public function decode(string $token, string $secret, ?string $issuer = null): ?array
    {
        if ($secret === '') {
            return null;
        }

        $segments = explode('.', $token);
        if (count($segments) !== 3) {
            return null;
        }

        [$encodedHeader, $encodedPayload, $encodedSignature] = $segments;
        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', $encodedHeader . '.' . $encodedPayload, $secret, true)
        );

        if (!hash_equals($expectedSignature, $encodedSignature)) {
            return null;
        }

        $payload = json_decode($this->base64UrlDecode($encodedPayload), true);
        if (!is_array($payload)) {
            return null;
        }

        $now = time();
        if ((int) ($payload['exp'] ?? 0) > 0 && (int) $payload['exp'] < $now) {
            return null;
        }

        if ((int) ($payload['nbf'] ?? 0) > 0 && (int) $payload['nbf'] > $now) {
            return null;
        }

        if ($issuer !== null && (string) ($payload['iss'] ?? '') !== $issuer) {
            return null;
        }

        return $payload;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $padding = strlen($value) % 4;
        if ($padding > 0) {
            $value .= str_repeat('=', 4 - $padding);
        }

        $decoded = base64_decode(strtr($value, '-_', '+/'), true);
        return $decoded === false ? '' : $decoded;
    }
}

<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;
use Yishaq\Server\Core\AppContext;

final class ChapaClient
{
    public function initialize(array $payload): array
    {
        return $this->request('POST', '/v1/transaction/initialize', $payload);
    }

    public function verify(string $txRef): array
    {
        return $this->request('GET', '/v1/transaction/verify/' . rawurlencode($txRef));
    }

    private function request(string $method, string $path, array $payload = []): array
    {
        if (!(bool) AppContext::config()->get('chapa.enabled', true)) {
            throw new RuntimeException('Chapa payments are disabled.');
        }

        $secretKey = (string) AppContext::config()->get('chapa.secret_key', '');
        if ($secretKey === '') {
            throw new RuntimeException('Chapa secret key is not configured.');
        }

        $baseUrl = rtrim((string) AppContext::config()->get('chapa.base_url', 'https://api.chapa.co'), '/');
        $url = $baseUrl . $path;
        $timeout = max(5, (int) AppContext::config()->get('chapa.timeout_seconds', 30));

        if (function_exists('curl_init')) {
            return $this->curlRequest($method, $url, $secretKey, $payload, $timeout);
        }

        return $this->streamRequest($method, $url, $secretKey, $payload, $timeout);
    }

    private function curlRequest(string $method, string $url, string $secretKey, array $payload, int $timeout): array
    {
        $handle = curl_init($url);
        if ($handle === false) {
            throw new RuntimeException('Unable to initialize Chapa request.');
        }

        curl_setopt_array($handle, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $secretKey,
                'Content-Type: application/json',
                'Accept: application/json',
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
        ]);

        if ($method !== 'GET') {
            curl_setopt($handle, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_SLASHES));
        }

        $raw = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        if ($raw === false) {
            throw new RuntimeException('Chapa request failed: ' . $error);
        }

        return $this->decodeResponse((string) $raw, $status);
    }

    private function streamRequest(string $method, string $url, string $secretKey, array $payload, int $timeout): array
    {
        $headerLines = [
            'Authorization: Bearer ' . $secretKey,
            'Content-Type: application/json',
            'Accept: application/json',
        ];

        $options = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headerLines),
                'ignore_errors' => true,
                'timeout' => $timeout,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ];

        if ($method !== 'GET') {
            $options['http']['content'] = json_encode($payload, JSON_UNESCAPED_SLASHES);
        }

        $context = stream_context_create($options);
        $raw = @file_get_contents($url, false, $context);
        $status = $this->statusFromHeaders($http_response_header ?? []);

        if ($raw === false) {
            $error = error_get_last();
            $message = is_array($error) ? (string) ($error['message'] ?? '') : '';
            throw new RuntimeException('Chapa request failed' . ($message !== '' ? ': ' . $message : '.'));
        }

        return $this->decodeResponse($raw, $status);
    }

    private function decodeResponse(string $raw, int $status): array
    {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            throw new RuntimeException('Chapa returned an invalid response.');
        }

        if ($status < 200 || $status >= 300) {
            throw new RuntimeException($this->responseMessage($decoded));
        }

        return $decoded;
    }

    private function responseMessage(array $decoded): string
    {
        foreach (['message', 'error', 'errors'] as $key) {
            if (!array_key_exists($key, $decoded)) {
                continue;
            }

            $message = $this->stringifyMessage($decoded[$key]);
            if ($message !== '') {
                return $message;
            }
        }

        return 'Chapa request failed.';
    }

    private function stringifyMessage(mixed $value): string
    {
        if (is_string($value)) {
            return trim($value);
        }

        if (is_scalar($value)) {
            return trim((string) $value);
        }

        if (!is_array($value)) {
            return '';
        }

        $parts = [];
        foreach ($value as $key => $item) {
            $itemMessage = $this->stringifyMessage($item);
            if ($itemMessage === '') {
                continue;
            }

            $parts[] = is_string($key) ? $key . ': ' . $itemMessage : $itemMessage;
        }

        return implode('; ', $parts);
    }

    private function statusFromHeaders(array $headers): int
    {
        $line = (string) ($headers[0] ?? '');
        if (preg_match('/\s(\d{3})\s/', $line, $matches) === 1) {
            return (int) $matches[1];
        }

        return 0;
    }
}

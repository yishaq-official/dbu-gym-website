<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use RuntimeException;

final class CsvService
{
    private string $delimiter;
    private string $enclosure;

    public function __construct(string $delimiter = ',', string $enclosure = '"')
    {
        $this->delimiter = $delimiter;
        $this->enclosure = $enclosure;
    }

    /**
     * @param array<array<string, mixed>> $data
     * @param array<string> $headers
     */
    public function generate(array $data, array $headers = []): string
    {
        if ($data === []) {
            return '';
        }

        $output = fopen('php://temp', 'r+');
        if ($output === false) {
            throw new RuntimeException('Unable to create CSV output.');
        }

        if ($headers !== []) {
            fputcsv($output, $headers, $this->delimiter, $this->enclosure);
        } elseif (isset($data[0])) {
            fputcsv($output, array_keys($data[0]), $this->delimiter, $this->enclosure);
        }

        foreach ($data as $row) {
            fputcsv($output, $row, $this->delimiter, $this->enclosure);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv ?: '';
    }

    /**
     * @param array<array<string, mixed>> $data
     */
    public function exportApprovals(array $data): string
    {
        $headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Member ID', 'Member Type', 'Membership Type', 'Created At'];
        $rows = array_map(function (array $item): array {
            return [
                $item['id'] ?? '',
                $item['name'] ?? '',
                $item['email'] ?? '',
                $item['phone'] ?? '',
                $item['account_status'] ?? '',
                $item['member_id'] ?? '',
                $item['member_type'] ?? '',
                $item['membership_type'] ?? '',
                $item['created_at'] ?? '',
            ];
        }, $data);

        return $this->generate($rows, $headers);
    }

    /**
     * @param array<array<string, mixed>> $data
     */
    public function exportApprovalHistory(array $data): string
    {
        $headers = ['ID', 'User Name', 'User Email', 'Action', 'Reason', 'Approved By', 'Approved At', 'Rejected By', 'Rejected At'];
        $rows = array_map(function (array $item): array {
            return [
                $item['id'] ?? '',
                $item['user_name'] ?? '',
                $item['user_email'] ?? '',
                $item['action'] ?? '',
                $item['reason'] ?? '',
                $item['acted_by_name'] ?? '',
                $item['approved_at'] ?? '',
                $item['acted_by_name'] ?? '', // for rejected
                $item['rejected_at'] ?? '',
            ];
        }, $data);

        return $this->generate($rows, $headers);
    }
}
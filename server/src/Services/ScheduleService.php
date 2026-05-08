<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use InvalidArgumentException;
use RuntimeException;
use Yishaq\Server\Models\Schedule;

final class ScheduleService
{
    private Schedule $schedules;

    public function __construct(?Schedule $schedules = null)
    {
        $this->schedules = $schedules ?? new Schedule();
    }

    public function visible(): array
    {
        return array_map([$this, 'format'], $this->schedules->all(true));
    }

    public function all(): array
    {
        return array_map([$this, 'format'], $this->schedules->all(false));
    }

    public function create(array $payload): array
    {
        $clean = $this->validate($payload);
        $id = $this->schedules->create($clean);

        return $this->findOrFail($id);
    }

    public function update(int $id, array $payload): array
    {
        $this->findOrFail($id);
        $clean = $this->validate($payload, false);
        $this->schedules->updateById($id, $clean);

        return $this->findOrFail($id);
    }

    public function cancel(int $id): array
    {
        $this->findOrFail($id);
        $this->schedules->updateById($id, ['status' => 'cancelled', 'is_visible' => false]);

        return $this->findOrFail($id);
    }

    private function findOrFail(int $id): array
    {
        $schedule = $this->schedules->findById($id);
        if ($schedule === null) {
            throw new RuntimeException('Schedule not found.');
        }

        return $this->format($schedule);
    }

    private function validate(array $payload, bool $requireAll = true): array
    {
        foreach (['title', 'day_label', 'start_time', 'end_time'] as $field) {
            if ($requireAll && trim((string) ($payload[$field] ?? '')) === '') {
                throw new InvalidArgumentException(str_replace('_', ' ', ucfirst($field)) . ' is required.');
            }
        }

        $clean = [];
        foreach (['title', 'day_label', 'location', 'notes'] as $field) {
            if (array_key_exists($field, $payload)) {
                $clean[$field] = trim((string) $payload[$field]);
            }
        }

        foreach (['start_time', 'end_time'] as $field) {
            if (array_key_exists($field, $payload)) {
                $clean[$field] = $this->normalizeTime((string) $payload[$field], $field);
            }
        }

        if (isset($clean['start_time'], $clean['end_time']) && $clean['start_time'] >= $clean['end_time']) {
            throw new InvalidArgumentException('Start time must be before end time.');
        }

        if (array_key_exists('status', $payload)) {
            $status = strtolower(trim((string) $payload['status']));
            if (!in_array($status, ['scheduled', 'cancelled', 'completed'], true)) {
                throw new InvalidArgumentException('Schedule status is invalid.');
            }
            $clean['status'] = $status;
        } elseif ($requireAll) {
            $clean['status'] = 'scheduled';
        }

        if (array_key_exists('is_visible', $payload)) {
            $clean['is_visible'] = filter_var($payload['is_visible'], FILTER_VALIDATE_BOOLEAN);
        } elseif ($requireAll) {
            $clean['is_visible'] = true;
        }

        if (array_key_exists('sort_order', $payload)) {
            $clean['sort_order'] = max(0, (int) $payload['sort_order']);
        } elseif ($requireAll) {
            $clean['sort_order'] = 0;
        }

        return $clean;
    }

    private function normalizeTime(string $value, string $field): string
    {
        $value = trim($value);
        if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $value)) {
            throw new InvalidArgumentException(str_replace('_', ' ', ucfirst($field)) . ' must use HH:MM format.');
        }

        return strlen($value) === 5 ? $value . ':00' : $value;
    }

    private function format(array $row): array
    {
        $row['id'] = (int) $row['id'];
        $row['is_visible'] = (bool) $row['is_visible'];
        $row['sort_order'] = (int) $row['sort_order'];
        $row['time_range'] = $this->timeLabel((string) ($row['start_time'] ?? ''), (string) ($row['end_time'] ?? ''));

        return $row;
    }

    private function timeLabel(string $start, string $end): string
    {
        if ($start === '' || $end === '') {
            return 'To be announced';
        }

        return substr($start, 0, 5) . ' - ' . substr($end, 0, 5);
    }
}

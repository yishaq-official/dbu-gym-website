<?php

declare(strict_types=1);

namespace Yishaq\Server\Services;

use InvalidArgumentException;
use RuntimeException;
use Yishaq\Server\Models\Equipment;

final class EquipmentService
{
    private Equipment $equipment;

    public function __construct(?Equipment $equipment = null)
    {
        $this->equipment = $equipment ?? new Equipment();
    }

    public function publicList(): array
    {
        return array_map([$this, 'format'], $this->equipment->all(true));
    }

    public function all(): array
    {
        return array_map([$this, 'format'], $this->equipment->all(false));
    }

    public function create(array $payload): array
    {
        $clean = $this->validate($payload);
        $id = $this->equipment->create($clean);

        return $this->findOrFail($id);
    }

    public function update(int $id, array $payload): array
    {
        $this->findOrFail($id);
        $clean = $this->validate($payload, false);
        $this->equipment->updateById($id, $clean);

        return $this->findOrFail($id);
    }

    public function delete(int $id): void
    {
        $this->findOrFail($id);
        $this->equipment->deleteById($id);
    }

    private function findOrFail(int $id): array
    {
        $equipment = $this->equipment->findById($id);
        if ($equipment === null) {
            throw new RuntimeException('Equipment not found.');
        }

        return $this->format($equipment);
    }

    private function validate(array $payload, bool $requireAll = true): array
    {
        $clean = [];

        foreach (['equipment_code', 'name'] as $field) {
            if ($requireAll && trim((string) ($payload[$field] ?? '')) === '') {
                throw new InvalidArgumentException(str_replace('_', ' ', ucfirst($field)) . ' is required.');
            }
        }

        foreach (['equipment_code', 'name', 'type', 'notes'] as $field) {
            if (array_key_exists($field, $payload)) {
                $clean[$field] = trim((string) $payload[$field]);
            }
        }

        if (isset($clean['equipment_code'])) {
            $clean['equipment_code'] = strtoupper($clean['equipment_code']);
            if (strlen($clean['equipment_code']) > 20) {
                throw new InvalidArgumentException('Equipment code must be 20 characters or fewer.');
            }
        }

        if (isset($clean['name']) && strlen($clean['name']) > 100) {
            throw new InvalidArgumentException('Equipment name must be 100 characters or fewer.');
        }

        if (isset($clean['type']) && strlen($clean['type']) > 50) {
            throw new InvalidArgumentException('Equipment type must be 50 characters or fewer.');
        }

        if (array_key_exists('status', $payload)) {
            $status = strtolower(trim((string) $payload['status']));
            if (!in_array($status, ['available', 'maintenance', 'out_of_service'], true)) {
                throw new InvalidArgumentException('Equipment status is invalid.');
            }
            $clean['status'] = $status;
        } elseif ($requireAll) {
            $clean['status'] = 'available';
        }

        return $clean;
    }

    private function format(array $row): array
    {
        $row['id'] = (int) $row['id'];
        $row['description'] = (string) ($row['notes'] ?? '');
        $row['status_label'] = ucwords(str_replace('_', ' ', (string) ($row['status'] ?? 'available')));

        return $row;
    }
}

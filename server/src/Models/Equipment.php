<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class Equipment extends BaseModel
{
    private bool $schemaReady = false;

    protected function table(): string
    {
        return 'equipment';
    }

    public function all(bool $onlyAvailable = false): array
    {
        $this->ensureSchema();

        $where = $onlyAvailable ? "WHERE status = 'available'" : '';

        return $this->db->select(
            "SELECT id, equipment_code, name, type, status, notes, created_at, updated_at
             FROM {$this->table()}
             {$where}
             ORDER BY id ASC"
        );
    }

    public function findById(int $id): ?array
    {
        $this->ensureSchema();

        return $this->db->first(
            "SELECT id, equipment_code, name, type, status, notes, created_at, updated_at
             FROM {$this->table()}
             WHERE id = :id
             LIMIT 1",
            ['id' => $id]
        );
    }

    public function create(array $payload): int
    {
        $this->ensureSchema();

        $this->db->statement(
            "INSERT INTO {$this->table()} (equipment_code, name, type, status, notes)
             VALUES (:equipment_code, :name, :type, :status, :notes)",
            [
                'equipment_code' => $payload['equipment_code'],
                'name' => $payload['name'],
                'type' => $payload['type'] ?? null,
                'status' => $payload['status'] ?? 'available',
                'notes' => $payload['notes'] ?? null,
            ]
        );

        $row = $this->db->first('SELECT LAST_INSERT_ID() AS id');
        return (int) ($row['id'] ?? 0);
    }

    public function updateById(int $id, array $payload): int
    {
        $this->ensureSchema();

        $columns = ['equipment_code', 'name', 'type', 'status', 'notes'];
        $set = [];
        $bindings = ['id' => $id];

        foreach ($columns as $column) {
            if (!array_key_exists($column, $payload)) {
                continue;
            }

            $set[] = "{$column} = :{$column}";
            $bindings[$column] = $payload[$column];
        }

        if ($set === []) {
            return 0;
        }

        return $this->db->statement(
            "UPDATE {$this->table()} SET " . implode(', ', $set) . ", updated_at = NOW() WHERE id = :id",
            $bindings
        );
    }

    public function deleteById(int $id): int
    {
        $this->ensureSchema();

        return $this->db->statement(
            "DELETE FROM {$this->table()} WHERE id = :id",
            ['id' => $id]
        );
    }

    private function ensureSchema(): void
    {
        if ($this->schemaReady) {
            return;
        }

        $this->db->statement(
            "CREATE TABLE IF NOT EXISTS {$this->table()} (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                equipment_code VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NULL,
                status ENUM('available','maintenance','out_of_service') NOT NULL DEFAULT 'available',
                notes TEXT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY equipment_code_unique (equipment_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );

        $this->schemaReady = true;

        $count = $this->db->first("SELECT COUNT(*) AS total FROM {$this->table()}");
        if ((int) ($count['total'] ?? 0) === 0) {
            foreach ($this->demoRows() as $row) {
                $this->create($row);
            }
        }
    }

    private function demoRows(): array
    {
        return [
            [
                'equipment_code' => 'EQ-FW-001',
                'name' => 'Free Weights',
                'type' => 'Strength',
                'status' => 'available',
                'notes' => 'Dumbbells, Olympic barbells, and calibrated plates for strength training.',
            ],
            [
                'equipment_code' => 'EQ-CARD-001',
                'name' => 'Cardio Zone',
                'type' => 'Cardio',
                'status' => 'available',
                'notes' => 'Treadmills, bikes, and rowers for endurance workouts.',
            ],
            [
                'equipment_code' => 'EQ-CABLE-001',
                'name' => 'Cable Machines',
                'type' => 'Strength',
                'status' => 'available',
                'notes' => 'Functional trainers and cable stations for controlled movement.',
            ],
            [
                'equipment_code' => 'EQ-CAL-001',
                'name' => 'Calisthenics Station',
                'type' => 'Bodyweight',
                'status' => 'available',
                'notes' => 'Pull-up bars and dip stations for bodyweight training.',
            ],
            [
                'equipment_code' => 'EQ-BOX-001',
                'name' => 'Combat Zone',
                'type' => 'Conditioning',
                'status' => 'available',
                'notes' => 'Heavy bags and conditioning equipment for high-intensity training.',
            ],
            [
                'equipment_code' => 'EQ-REC-001',
                'name' => 'Recovery Tools',
                'type' => 'Recovery',
                'status' => 'available',
                'notes' => 'Stretching, massage, and post-workout recovery tools.',
            ],
        ];
    }
}

<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class Schedule extends BaseModel
{
    private bool $schemaReady = false;

    protected function table(): string
    {
        return 'schedules';
    }

    public function all(bool $onlyVisible = false): array
    {
        $this->ensureSchema();

        $where = $onlyVisible ? "WHERE is_visible = 1 AND status = 'scheduled'" : '';

        return $this->db->select(
            "SELECT id, title, day_label, start_time, end_time, location, notes, status, is_visible, sort_order, created_at, updated_at
             FROM {$this->table()}
             {$where}
             ORDER BY sort_order ASC, id ASC"
        );
    }

    public function findById(int $id): ?array
    {
        $this->ensureSchema();

        return $this->db->first(
            "SELECT id, title, day_label, start_time, end_time, location, notes, status, is_visible, sort_order, created_at, updated_at
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
            "INSERT INTO {$this->table()}
                (title, day_label, start_time, end_time, location, notes, status, is_visible, sort_order, scheduled_datetime)
             VALUES
                (:title, :day_label, :start_time, :end_time, :location, :notes, :status, :is_visible, :sort_order, :scheduled_datetime)",
            [
                'title' => $payload['title'],
                'day_label' => $payload['day_label'],
                'start_time' => $payload['start_time'],
                'end_time' => $payload['end_time'],
                'location' => $payload['location'] ?? null,
                'notes' => $payload['notes'] ?? null,
                'status' => $payload['status'] ?? 'scheduled',
                'is_visible' => !empty($payload['is_visible']) ? 1 : 0,
                'sort_order' => (int) ($payload['sort_order'] ?? 0),
                'scheduled_datetime' => $payload['scheduled_datetime'] ?? date('Y-m-d H:i:s'),
            ]
        );

        $row = $this->db->first('SELECT LAST_INSERT_ID() AS id');
        return (int) ($row['id'] ?? 0);
    }

    public function updateById(int $id, array $payload): int
    {
        $this->ensureSchema();

        $columns = [
            'title',
            'day_label',
            'start_time',
            'end_time',
            'location',
            'notes',
            'status',
            'is_visible',
            'sort_order',
        ];

        $set = [];
        $bindings = ['id' => $id];

        foreach ($columns as $column) {
            if (!array_key_exists($column, $payload)) {
                continue;
            }

            $set[] = "{$column} = :{$column}";
            $bindings[$column] = $column === 'is_visible'
                ? (!empty($payload[$column]) ? 1 : 0)
                : $payload[$column];
        }

        if ($set === []) {
            return 0;
        }

        return $this->db->statement(
            "UPDATE {$this->table()} SET " . implode(', ', $set) . ", updated_at = NOW() WHERE id = :id",
            $bindings
        );
    }

    private function ensureSchema(): void
    {
        if ($this->schemaReady) {
            return;
        }

        $columns = $this->db->select("SHOW COLUMNS FROM {$this->table()}");
        $existing = array_fill_keys(array_map(static fn(array $column): string => (string) $column['Field'], $columns), true);

        $definitions = [
            'title' => "ALTER TABLE {$this->table()} ADD COLUMN title VARCHAR(120) NOT NULL DEFAULT 'Gym Hours' AFTER id",
            'day_label' => "ALTER TABLE {$this->table()} ADD COLUMN day_label VARCHAR(80) NOT NULL DEFAULT 'Weekdays' AFTER title",
            'start_time' => "ALTER TABLE {$this->table()} ADD COLUMN start_time TIME NULL AFTER day_label",
            'end_time' => "ALTER TABLE {$this->table()} ADD COLUMN end_time TIME NULL AFTER start_time",
            'location' => "ALTER TABLE {$this->table()} ADD COLUMN location VARCHAR(120) NULL AFTER end_time",
            'notes' => "ALTER TABLE {$this->table()} ADD COLUMN notes TEXT NULL AFTER location",
            'is_visible' => "ALTER TABLE {$this->table()} ADD COLUMN is_visible TINYINT(1) NOT NULL DEFAULT 1 AFTER status",
            'sort_order' => "ALTER TABLE {$this->table()} ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER is_visible",
        ];

        foreach ($definitions as $column => $sql) {
            if (!isset($existing[$column])) {
                $this->db->statement($sql);
            }
        }

        $this->schemaReady = true;

        $count = $this->db->first("SELECT COUNT(*) AS total FROM {$this->table()}");
        if ((int) ($count['total'] ?? 0) === 0) {
            foreach ($this->defaultRows() as $row) {
                $this->create($row);
            }
        }
    }

    private function defaultRows(): array
    {
        return [
            [
                'title' => 'Gym Hours',
                'day_label' => 'Monday - Friday',
                'start_time' => '05:00:00',
                'end_time' => '23:00:00',
                'location' => 'Main gym',
                'notes' => 'Regular weekday training hours',
                'is_visible' => true,
                'sort_order' => 1,
            ],
            [
                'title' => 'Saturday Hours',
                'day_label' => 'Saturday',
                'start_time' => '06:00:00',
                'end_time' => '22:00:00',
                'location' => 'Main gym',
                'notes' => 'Weekend training hours',
                'is_visible' => true,
                'sort_order' => 2,
            ],
            [
                'title' => 'Sunday Hours',
                'day_label' => 'Sunday',
                'start_time' => '07:00:00',
                'end_time' => '21:00:00',
                'location' => 'Main gym',
                'notes' => 'Weekend training hours',
                'is_visible' => true,
                'sort_order' => 3,
            ],
        ];
    }
}

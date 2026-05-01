<?php

declare(strict_types=1);

namespace Yishaq\Server\Models;

final class SystemSetting extends BaseModel
{
    protected function table(): string
    {
        return 'system_settings';
    }

    public function getSingleton(): ?array
    {
        $settings = $this->db->first(
            "SELECT * FROM {$this->table()} WHERE id = 1 LIMIT 1"
        );

        if ($settings === null) {
            $this->db->statement(
                "INSERT INTO {$this->table()} (id) VALUES (1)"
            );
            $settings = $this->db->first(
                "SELECT * FROM {$this->table()} WHERE id = 1 LIMIT 1"
            );
        }

        return $settings;
    }

    public function updateSingleton(array $attributes): int
    {
        if ($attributes === []) {
            return 0;
        }

        $setClauses = [];
        $bindings = [];

        foreach ($attributes as $column => $value) {
            $setClauses[] = "{$column} = :{$column}";
            $bindings[$column] = $value;
        }

        $exists = $this->rowExists();
        $setSql = implode(', ', $setClauses);

        $updated = $this->db->statement(
            "UPDATE {$this->table()} SET {$setSql}, updated_at = NOW() WHERE id = 1",
            $bindings
        );

        if (!$exists) {
            $columns = implode(', ', array_map(static fn(string $column): string => "`{$column}`", array_keys($attributes)));
            $placeholders = implode(', ', array_map(static fn(string $column): string => ":{$column}", array_keys($attributes)));
            $this->db->statement(
                "INSERT INTO {$this->table()} (id, {$columns}, updated_at) VALUES (1, {$placeholders}, NOW())",
                $bindings
            );
        }

        return $updated;
    }

    private function rowExists(): bool
    {
        return (bool) $this->db->first(
            "SELECT id FROM {$this->table()} WHERE id = 1 LIMIT 1"
        );
    }
}

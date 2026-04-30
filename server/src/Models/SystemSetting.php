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
        return $this->db->first(
            "SELECT * FROM {$this->table()} WHERE id = 1 LIMIT 1"
        );
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

        $setSql = implode(', ', $setClauses);

        return $this->db->statement(
            "UPDATE {$this->table()} SET {$setSql}, updated_at = NOW() WHERE id = 1",
            $bindings
        );
    }
}

<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HubSetting extends Model
{
    protected $table = 'hub_settings';
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['key', 'value'];

    public static function get(string $key, $default = null): mixed
    {
        $row = static::find($key);
        if (!$row) return $default;
        $decoded = json_decode($row->value, true);
        return $decoded !== null ? $decoded : $row->value;
    }

    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => is_string($value) ? json_encode($value) : json_encode($value)]
        );
    }
}

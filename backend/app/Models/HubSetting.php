<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class HubSetting extends Model
{
    protected $table    = 'hub_settings';
    protected $fillable = ['key', 'value'];

    public static function getValue(string $key, ?string $default = null): ?string
    {
        $cached = Cache::remember("hub_setting_{$key}", 300, function () use ($key) {
            return static::where('key', $key)->value('value');
        });

        return $cached ?? $default;
    }

    public static function set(string $key, string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("hub_setting_{$key}");
    }

    public static function remove(string $key): void
    {
        static::where('key', $key)->delete();
        Cache::forget("hub_setting_{$key}");
    }
}

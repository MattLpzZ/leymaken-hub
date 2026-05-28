<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = ['level', 'module', 'message', 'meta'];
    protected $casts = ['meta' => 'array'];

    public static function write(string $message, string $level = 'info', string $module = 'system', array $meta = []): void
    {
        static::create(compact('level', 'module', 'message', 'meta'));
        // Keep only last 500 entries
        $oldest = static::orderByDesc('id')->skip(500)->first();
        if ($oldest) {
            static::where('id', '<=', $oldest->id)->delete();
        }
    }
}

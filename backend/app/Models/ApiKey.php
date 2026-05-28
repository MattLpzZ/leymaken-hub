<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    protected $fillable = [
        'label', 'key_hash', 'key_prefix', 'key_display',
        'company_id', 'active', 'kill_switch', 'environment',
        'last_used_at', 'requests_count', 'notes',
    ];

    protected $hidden = ['key_hash'];

    protected $casts = [
        'active'      => 'boolean',
        'kill_switch' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(SaasCompany::class, 'company_id');
    }

    public static function generate(): array
    {
        $plain   = Str::random(32);
        $prefix  = substr($plain, 0, 12);
        $display = $prefix . '...' . substr($plain, -4);

        return [
            'plain'   => $plain,
            'prefix'  => $prefix,
            'display' => $display,
            'hash'    => hash('sha256', $plain),
        ];
    }
}

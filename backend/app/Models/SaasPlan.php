<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasPlan extends Model
{
    protected $fillable = [
        'name', 'price', 'cycle', 'max_users', 'description', 'modules', 'active',
    ];

    protected $casts = [
        'price'   => 'decimal:2',
        'modules' => 'array',
        'active'  => 'boolean',
    ];

    public function companies()
    {
        return $this->hasMany(SaasCompany::class, 'plan_id');
    }
}

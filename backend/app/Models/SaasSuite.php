<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasSuite extends Model
{
    protected $fillable = ['key', 'label', 'icon', 'modules', 'active'];

    protected $casts = [
        'modules' => 'array',
        'active'  => 'boolean',
    ];
}

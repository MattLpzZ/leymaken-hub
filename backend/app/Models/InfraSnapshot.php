<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InfraSnapshot extends Model
{
    protected $fillable = ['source', 'data', 'polled_at'];
    protected $casts    = ['data' => 'array', 'polled_at' => 'datetime'];
}

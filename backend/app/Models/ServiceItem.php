<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceItem extends Model
{
    protected $fillable = ['name', 'category', 'price', 'unit', 'description', 'active'];

    protected $casts = ['price' => 'float', 'active' => 'boolean'];
}

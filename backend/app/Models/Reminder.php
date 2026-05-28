<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reminder extends Model
{
    protected $fillable = ['title', 'description', 'type', 'related_to', 'module', 'due_date', 'status'];

    protected $casts = ['due_date' => 'datetime'];
}

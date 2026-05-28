<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScheduledTransaction extends Model
{
    protected $fillable = ['description', 'category', 'amount', 'type', 'account', 'frequency', 'next_date', 'day_of_month', 'active'];

    protected $casts = ['next_date' => 'date', 'amount' => 'float', 'active' => 'boolean'];
}

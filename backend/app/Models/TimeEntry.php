<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimeEntry extends Model
{
    protected $fillable = ['project_id', 'description', 'hours', 'date', 'billable', 'hourly_rate', 'started_at', 'stopped_at'];

    protected $casts = [
        'date'       => 'date',
        'started_at' => 'datetime',
        'stopped_at' => 'datetime',
        'hours'      => 'float',
        'hourly_rate'=> 'float',
        'billable'   => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(HubProject::class, 'project_id');
    }
}

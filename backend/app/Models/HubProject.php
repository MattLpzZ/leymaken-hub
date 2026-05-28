<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HubProject extends Model
{
    protected $table = 'projects';

    protected $fillable = ['name', 'client_id', 'status', 'budget', 'deadline', 'description'];

    protected $casts = ['deadline' => 'date', 'budget' => 'float'];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'project_id');
    }
}

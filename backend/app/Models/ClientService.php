<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientService extends Model
{
    protected $fillable = [
        'client_id', 'type', 'name', 'status', 'monthly_value', 'start_date', 'notes', 'meta',
    ];

    protected $casts = [
        'meta'          => 'array',
        'monthly_value' => 'float',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}

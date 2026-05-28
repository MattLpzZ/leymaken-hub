<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = ['type', 'description', 'amount', 'category', 'date', 'client_id', 'account', 'reference', 'notes'];

    protected $casts = ['date' => 'date', 'amount' => 'float'];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}

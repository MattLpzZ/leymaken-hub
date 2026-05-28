<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends Model
{
    protected $fillable = [
        'client_id', 'number', 'status', 'issue_date', 'expires_date',
        'subtotal', 'tax', 'total', 'currency', 'converted_invoice_id', 'notes',
    ];

    protected $casts = [
        'issue_date'   => 'date',
        'expires_date' => 'date',
        'subtotal'     => 'float',
        'tax'          => 'float',
        'total'        => 'float',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuoteItem::class);
    }

    public function convertedInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'converted_invoice_id');
    }
}

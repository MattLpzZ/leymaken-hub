<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    protected $fillable = [
        'name', 'email', 'phone', 'company_name', 'rnc', 'address', 'notes', 'status',
    ];

    public function services(): HasMany
    {
        return $this->hasMany(ClientService::class);
    }

    public function getMrrAttribute(): float
    {
        return (float) $this->services->where('status', 'active')->sum('monthly_value');
    }

    protected $appends = ['mrr'];
}

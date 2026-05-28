<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class CompanyUser extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = 'company_users';

    protected $fillable = [
        'company_id', 'name', 'email', 'password', 'role', 'active', 'last_login_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password'      => 'hashed',
            'active'        => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function company()
    {
        return $this->belongsTo(SaasCompany::class, 'company_id');
    }
}

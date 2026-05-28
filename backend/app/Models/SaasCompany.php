<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaasCompany extends Model
{
    protected $fillable = [
        'name', 'subdomain', 'plan_id', 'status',
        'trial_ends_at', 'subscription_ends_at', 'users_count',
        'contact_email', 'contact_phone', 'notes', 'active_suites',
    ];

    protected $casts = [
        'active_suites' => 'array',
    ];

    public function plan()
    {
        return $this->belongsTo(SaasPlan::class, 'plan_id');
    }

    public function users()
    {
        return $this->hasMany(CompanyUser::class, 'company_id');
    }

    public function apiKeys()
    {
        return $this->hasMany(ApiKey::class, 'company_id');
    }

    public function adminUser()
    {
        return $this->hasOne(CompanyUser::class, 'company_id')
            ->where('role', 'admin')
            ->orderBy('id');
    }

    public function hasSuite(string $suite): bool
    {
        return in_array($suite, $this->active_suites ?? []);
    }

    public function syncSuitesFromPlan(): void
    {
        if ($this->plan_id && $this->plan) {
            $this->update(['active_suites' => $this->plan->modules ?? []]);
        }
    }
}

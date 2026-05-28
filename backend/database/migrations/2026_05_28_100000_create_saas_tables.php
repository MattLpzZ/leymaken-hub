<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saas_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price', 10, 2)->default(0);
            $table->enum('cycle', ['monthly', 'annual'])->default('monthly');
            $table->unsignedInteger('max_users')->default(5);
            $table->text('description')->nullable();
            $table->json('modules')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('saas_companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('subdomain')->unique();
            $table->foreignId('plan_id')->nullable()->constrained('saas_plans')->nullOnDelete();
            $table->enum('status', ['trial', 'active', 'suspended', 'cancelled'])->default('trial');
            $table->date('trial_ends_at')->nullable();
            $table->date('subscription_ends_at')->nullable();
            $table->unsignedInteger('users_count')->default(0);
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->text('notes')->nullable();
            $table->json('active_suites')->nullable();
            $table->timestamps();
        });

        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('key_hash');
            $table->string('key_prefix', 12);
            $table->string('key_display', 30);
            $table->foreignId('company_id')->nullable()->constrained('saas_companies')->nullOnDelete();
            $table->boolean('active')->default(true);
            $table->boolean('kill_switch')->default(false);
            $table->enum('environment', ['production', 'sandbox'])->default('production');
            $table->timestamp('last_used_at')->nullable();
            $table->unsignedBigInteger('requests_count')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('company_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('saas_companies')->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->enum('role', ['admin', 'manager', 'operator', 'viewer'])->default('operator');
            $table->boolean('active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->unique(['company_id', 'email']);
        });

        Schema::create('saas_suites', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->string('label', 150);
            $table->string('icon', 50)->default('Package');
            $table->json('modules')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saas_suites');
        Schema::dropIfExists('company_users');
        Schema::dropIfExists('api_keys');
        Schema::dropIfExists('saas_companies');
        Schema::dropIfExists('saas_plans');
    }
};

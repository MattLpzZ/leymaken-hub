<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('company_name')->nullable();
            $table->string('rnc', 50)->nullable();
            $table->text('address')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['prospect', 'active', 'inactive'])->default('prospect');
            $table->timestamps();
        });

        Schema::create('client_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['suite', 'automation', 'project', 'ubicado']);
            $table->string('name');
            $table->enum('status', ['pending', 'active', 'paused', 'cancelled'])->default('pending');
            $table->decimal('monthly_value', 10, 2)->default(0);
            $table->date('start_date')->nullable();
            $table->text('notes')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_services');
        Schema::dropIfExists('clients');
    }
};

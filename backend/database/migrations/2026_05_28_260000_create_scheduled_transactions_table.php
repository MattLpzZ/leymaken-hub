<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->string('category', 100)->nullable();
            $table->decimal('amount', 12, 2);
            $table->enum('type', ['income', 'expense']);
            $table->string('account', 50)->default('brand');
            $table->enum('frequency', ['weekly', 'biweekly', 'monthly', 'yearly']);
            $table->date('next_date');
            $table->tinyInteger('day_of_month')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_transactions');
    }
};

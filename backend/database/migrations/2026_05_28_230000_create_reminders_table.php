<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type', 50)->default('reminder');
            $table->string('related_to', 100)->nullable();
            $table->string('module', 50)->nullable();
            $table->dateTime('due_date')->nullable();
            $table->enum('status', ['pendiente', 'completado', 'descartado'])->default('pendiente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};

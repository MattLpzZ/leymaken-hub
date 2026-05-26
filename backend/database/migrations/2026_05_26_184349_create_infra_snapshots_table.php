<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('infra_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('source');        // 'docker' | 'github' | 'cloudflare'
            $table->json('data');
            $table->timestamp('polled_at');
            $table->timestamps();

            $table->index(['source', 'polled_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('infra_snapshots');
    }
};

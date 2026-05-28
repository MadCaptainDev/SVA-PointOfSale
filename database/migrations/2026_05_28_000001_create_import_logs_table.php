<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_logs', function (Blueprint $table) {
            $table->id();
            $table->string('file_name');
            $table->integer('total_rows')->default(0);
            $table->integer('imported')->default(0);
            $table->integer('failed')->default(0);
            $table->integer('skipped')->default(0);
            $table->enum('status', ['success', 'partial', 'failed', 'dry_run']);
            $table->json('results');
            $table->string('error_report_path')->nullable();
            $table->boolean('is_dry_run')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_logs');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('employee_code')->nullable()->unique();
            $table->string('job_title')->nullable();
            $table->string('department')->nullable();
            $table->date('joined_at')->nullable();
            $table->decimal('base_salary', 15, 2)->nullable();
            $table->decimal('commission_rate', 8, 4)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_profiles');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff_incentive_earnings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('sale_id')->nullable()->unique();
            $table->decimal('sale_amount', 15, 2);
            $table->decimal('commission_rate', 8, 4);
            $table->decimal('amount', 15, 2);
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')
                ->onUpdate('cascade')
                ->onDelete('cascade');
            $table->foreign('sale_id')->references('id')->on('sales')
                ->onUpdate('cascade')
                ->onDelete('set null');
            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_incentive_earnings');
    }
};

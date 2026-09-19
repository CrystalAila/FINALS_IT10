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
        Schema::create('admin_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('farm_id')->nullable()->constrained('farms')->nullOnDelete();
            $table->string('billing_period', 7); // Format: YYYY-MM (e.g. 2026-09)
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('total_revenue', 12, 2)->default(0.00);
            $table->decimal('share_percentage', 5, 2)->default(5.00);
            $table->decimal('share_amount', 12, 2)->default(0.00);
            $table->date('due_date');
            $table->date('grace_period_date'); // due_date + 7 days
            $table->enum('status', ['unpaid', 'paid', 'overdue'])->default('unpaid');
            $table->timestamp('paid_at')->nullable();
            $table->string('payment_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['seller_id', 'billing_period']);
            $table->index(['status', 'due_date']);
            $table->index('billing_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_shares');
    }
};

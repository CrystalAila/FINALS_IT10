<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('riders')) {
            Schema::create('riders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('farm_id')->constrained()->cascadeOnDelete();
                $table->string('fullname');
                $table->string('phone', 30);
                $table->string('photo_path')->nullable();
                $table->timestamps();
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'rider_id')) {
                    $table->foreignId('rider_id')->nullable()->after('rider_name')->constrained('riders')->nullOnDelete();
                }
            });
        }

        // Update the status enum to include 'confirmed' in MySQL
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'rider_id')) {
                    $table->dropConstrainedForeignId('rider_id');
                }
            });
        }

        Schema::dropIfExists('riders');

        // Revert the status enum back
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'processing', 'ready', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }
};

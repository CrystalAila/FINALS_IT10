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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('postal_code');
            }
            if (!Schema::hasColumn('orders', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
        });

        Schema::table('addresses', function (Blueprint $table) {
            if (!Schema::hasColumn('addresses', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('street_address');
            }
            if (!Schema::hasColumn('addresses', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'awaiting_weighing', 'price_confirmed', 'confirmed', 'processing', 'ready', 'ready_for_delivery', 'claimed', 'out_for_delivery', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'longitude')) {
                $table->dropColumn('longitude');
            }
            if (Schema::hasColumn('orders', 'latitude')) {
                $table->dropColumn('latitude');
            }
        });

        Schema::table('addresses', function (Blueprint $table) {
            if (Schema::hasColumn('addresses', 'longitude')) {
                $table->dropColumn('longitude');
            }
            if (Schema::hasColumn('addresses', 'latitude')) {
                $table->dropColumn('latitude');
            }
        });

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'awaiting_weighing', 'price_confirmed', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }
};

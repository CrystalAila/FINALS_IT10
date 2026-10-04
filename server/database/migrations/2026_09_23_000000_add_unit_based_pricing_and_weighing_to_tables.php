<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update products table
        if (Schema::hasTable('products')) {
            // Map legacy category names first
            DB::statement("UPDATE products SET category = 'live_poultry' WHERE category IN ('broiler', 'native')");
            DB::statement("UPDATE products SET category = 'dressed_meat' WHERE category = 'dressed_chicken'");

            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'unit_type')) {
                    $table->enum('unit_type', ['per_kilo', 'per_head', 'per_tray', 'per_piece'])
                        ->default('per_head')
                        ->after('category');
                }
                if (!Schema::hasColumn('products', 'increment_step')) {
                    $table->decimal('increment_step', 4, 2)
                        ->default(1.00)
                        ->after('unit_type');
                }
            });

            // Set sensible unit defaults for existing products
            DB::statement("UPDATE products SET unit_type = 'per_kilo', increment_step = 0.50 WHERE category = 'dressed_meat'");
            DB::statement("UPDATE products SET unit_type = 'per_head', increment_step = 1.00 WHERE category = 'live_poultry'");
            DB::statement("UPDATE products SET unit_type = 'per_tray', increment_step = 1.00 WHERE category = 'eggs'");
        }

        // 2. Update order_items table
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (!Schema::hasColumn('order_items', 'unit_type')) {
                    $table->enum('unit_type', ['per_kilo', 'per_head', 'per_tray', 'per_piece'])
                        ->default('per_head')
                        ->after('size');
                }
                if (!Schema::hasColumn('order_items', 'estimated_quantity')) {
                    $table->decimal('estimated_quantity', 10, 2)
                        ->default(0.00)
                        ->after('unit_type');
                }
                if (!Schema::hasColumn('order_items', 'actual_quantity')) {
                    $table->decimal('actual_quantity', 10, 2)
                        ->nullable()
                        ->default(null)
                        ->after('estimated_quantity');
                }
            });

            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE order_items MODIFY COLUMN quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00");
            }

            // Sync existing order_items quantity to estimated_quantity & actual_quantity
            DB::statement("UPDATE order_items SET estimated_quantity = quantity, actual_quantity = quantity WHERE estimated_quantity = 0");
        }

        // 3. Update orders table status enum
        if (Schema::hasTable('orders') && DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'awaiting_weighing', 'price_confirmed', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (Schema::hasColumn('order_items', 'actual_quantity')) {
                    $table->dropColumn('actual_quantity');
                }
                if (Schema::hasColumn('order_items', 'estimated_quantity')) {
                    $table->dropColumn('estimated_quantity');
                }
                if (Schema::hasColumn('order_items', 'unit_type')) {
                    $table->dropColumn('unit_type');
                }
            });

            if (DB::connection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE order_items MODIFY COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1");
            }
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'increment_step')) {
                    $table->dropColumn('increment_step');
                }
                if (Schema::hasColumn('products', 'unit_type')) {
                    $table->dropColumn('unit_type');
                }
            });
        }

        if (Schema::hasTable('orders') && DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('pending', 'confirmed', 'processing', 'ready', 'out_for_delivery', 'completed', 'cancelled') DEFAULT 'pending'");
        }
    }
};

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
        // Alter the role column to include 'seller'
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'seller', 'reseller', 'admin') DEFAULT 'customer'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert enum back
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'reseller', 'admin') DEFAULT 'customer'");
        }
    }
};

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
        // In this application, sellers / shops are stored in the 'farms' table.
        // We support 'farms', as well as 'sellers' or 'shops' if present.
        $targetTables = array_filter(['farms', 'sellers', 'shops'], fn($table) => Schema::hasTable($table));

        foreach ($targetTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'latitude')) {
                    $table->decimal('latitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn($tableName, 'longitude')) {
                    $table->decimal('longitude', 10, 7)->nullable();
                }
                if (!Schema::hasColumn($tableName, 'full_address')) {
                    $table->string('full_address')->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $targetTables = array_filter(['farms', 'sellers', 'shops'], fn($table) => Schema::hasTable($table));

        foreach ($targetTables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                $columnsToDrop = [];
                if (Schema::hasColumn($tableName, 'full_address')) {
                    $columnsToDrop[] = 'full_address';
                }
                if (Schema::hasColumn($tableName, 'longitude')) {
                    $columnsToDrop[] = 'longitude';
                }
                if (Schema::hasColumn($tableName, 'latitude')) {
                    $columnsToDrop[] = 'latitude';
                }
                if (!empty($columnsToDrop)) {
                    $table->dropColumn($columnsToDrop);
                }
            });
        }
    }
};

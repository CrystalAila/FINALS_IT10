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
        Schema::table('addresses', function (Blueprint $table) {
            if (!Schema::hasColumn('addresses', 'floor_unit')) {
                $table->string('floor_unit', 255)->nullable()->after('street_address');
            }
            if (!Schema::hasColumn('addresses', 'delivery_notes')) {
                $table->text('delivery_notes')->nullable()->after('floor_unit');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            if (Schema::hasColumn('addresses', 'delivery_notes')) {
                $table->dropColumn('delivery_notes');
            }
            if (Schema::hasColumn('addresses', 'floor_unit')) {
                $table->dropColumn('floor_unit');
            }
        });
    }
};

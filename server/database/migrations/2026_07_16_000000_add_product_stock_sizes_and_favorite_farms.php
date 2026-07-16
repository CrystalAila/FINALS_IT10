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
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('stock_small')->default(0)->after('price_jumbo');
            $table->unsignedInteger('stock_medium')->default(0)->after('stock_small');
            $table->unsignedInteger('stock_large')->default(0)->after('stock_medium');
            $table->unsignedInteger('stock_jumbo')->default(0)->after('stock_large');
            $table->string('farm_origin')->nullable()->after('stock_jumbo');
        });

        Schema::create('favorite_farms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('farm_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'farm_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favorite_farms');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'stock_small',
                'stock_medium',
                'stock_large',
                'stock_jumbo',
                'farm_origin'
            ]);
        });
    }
};

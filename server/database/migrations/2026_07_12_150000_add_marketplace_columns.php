<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('farms', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->constrained()->cascadeOnDelete();
            $table->string('name')->after('user_id');
            $table->string('location')->nullable()->after('name');
            $table->text('description')->nullable()->after('location');
            $table->string('permit_file')->nullable()->after('description');
            $table->enum('permit_status', ['pending', 'approved', 'rejected'])->default('pending')->after('permit_file');
            $table->string('logo')->nullable()->after('permit_status');
            $table->decimal('rating', 3, 2)->default(0)->after('logo');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('farm_id')->after('id')->constrained()->cascadeOnDelete();
            $table->string('name')->after('farm_id');
            $table->text('description')->nullable()->after('name');
            $table->string('image')->nullable()->after('description');
            $table->string('category')->default('broiler')->after('image');
            $table->decimal('price_small', 10, 2)->default(0)->after('category');
            $table->decimal('price_medium', 10, 2)->default(0)->after('price_small');
            $table->decimal('price_large', 10, 2)->default(0)->after('price_medium');
            $table->decimal('price_jumbo', 10, 2)->default(0)->after('price_large');
            $table->unsignedInteger('stock')->default(0)->after('price_jumbo');
            $table->decimal('rating', 3, 2)->default(0)->after('stock');
            $table->boolean('is_active')->default(true)->after('rating');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('customer_id')->after('id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('farm_id')->nullable()->after('customer_id')->constrained()->nullOnDelete();
            $table->enum('status', ['pending', 'processing', 'ready', 'completed', 'cancelled'])->default('pending')->after('farm_id');
            $table->enum('delivery_type', ['pickup', 'delivery'])->default('pickup')->after('status');
            $table->enum('payment_method', ['cash_on_pickup', 'cash_on_delivery'])->default('cash_on_pickup')->after('delivery_type');
            $table->decimal('total', 12, 2)->default(0)->after('payment_method');
            $table->string('address_line')->nullable()->after('total');
            $table->string('city')->nullable()->after('address_line');
            $table->string('province')->nullable()->after('city');
            $table->string('postal_code')->nullable()->after('province');
            $table->string('phone')->nullable()->after('postal_code');
            $table->string('rider_name')->nullable()->after('phone');
            $table->text('notes')->nullable()->after('rider_name');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->enum('size', ['small', 'medium', 'large', 'jumbo']);
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('subtotal', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');

        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_id');
            $table->dropConstrainedForeignId('farm_id');
            $table->dropColumn([
                'status', 'delivery_type', 'payment_method', 'total',
                'address_line', 'city', 'province', 'postal_code', 'phone', 'rider_name', 'notes',
            ]);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('farm_id');
            $table->dropColumn([
                'name', 'description', 'image', 'category',
                'price_small', 'price_medium', 'price_large', 'price_jumbo',
                'stock', 'rating', 'is_active',
            ]);
        });

        Schema::table('farms', function (Blueprint $table) {
            $table->dropConstrainedForeignId('user_id');
            $table->dropColumn([
                'name', 'location', 'description', 'permit_file',
                'permit_status', 'logo', 'rating',
            ]);
        });
    }
};

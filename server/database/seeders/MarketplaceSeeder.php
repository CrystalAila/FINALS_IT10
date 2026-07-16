<?php

namespace Database\Seeders;

use App\Models\Farm;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class MarketplaceSeeder extends Seeder
{
    public function run(): void
    {
        $seller = User::firstOrCreate(
            ['username' => 'seller'],
            [
                'fullname' => 'Santos Layer Farm',
                'password' => Hash::make('password123'),
                'role' => 'reseller',
            ]
        );

        $farm = Farm::firstOrCreate(
            ['user_id' => $seller->id],
            [
                'name' => 'Santos Layer Farm',
                'location' => 'Roxas City, Capiz',
                'description' => 'Trusted local farm supplying fresh broilers, native chickens, and eggs.',
                'permit_status' => 'approved',
                'permit_file' => 'permits/santos-lgu.pdf',
                'rating' => 4.8,
            ]
        );

        $products = [
            [
                'name' => 'Fresh Broiler Chicken',
                'description' => 'Farm-raised broiler chicken, cleaned and ready to cook. Raised without antibiotics.',
                'image' => 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop',
                'category' => 'broiler',
                'price_small' => 180, 'price_medium' => 220, 'price_large' => 260, 'price_jumbo' => 300,
                'stock' => 50,
                'stock_small' => 10, 'stock_medium' => 20, 'stock_large' => 15, 'stock_jumbo' => 5,
                'farm_origin' => 'Santos Poultry Farm, Roxas City, Capiz',
                'rating' => 4.9,
            ],
            [
                'name' => 'Native Free-Range Chicken',
                'description' => 'Slow-grown native chicken with rich flavor, perfect for tinola and adobo.',
                'image' => 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&h=400&fit=crop',
                'category' => 'native',
                'price_small' => 250, 'price_medium' => 320, 'price_large' => 390, 'price_jumbo' => 450,
                'stock' => 30,
                'stock_small' => 5, 'stock_medium' => 10, 'stock_large' => 10, 'stock_jumbo' => 5,
                'farm_origin' => 'Dumarao Native Farm, Capiz',
                'rating' => 4.7,
            ],
            [
                'name' => 'Premium Brown Eggs (Tray)',
                'description' => 'Fresh brown eggs from healthy layers. 30 pieces per tray.',
                'image' => 'https://images.unsplash.com/photo-1582722879805-a7e02e48a2e8?w=600&h=400&fit=crop',
                'category' => 'eggs',
                'price_small' => 120, 'price_medium' => 150, 'price_large' => 180, 'price_jumbo' => 210,
                'stock' => 100,
                'stock_small' => 20, 'stock_medium' => 40, 'stock_large' => 30, 'stock_jumbo' => 10,
                'farm_origin' => 'Panay Egg Coop, Panay, Capiz',
                'rating' => 4.6,
            ],
            [
                'name' => 'Dressed Chicken Special',
                'description' => 'Pre-dressed whole chicken, ideal for family meals and gatherings.',
                'image' => 'https://images.unsplash.com/photo-1598103442097-8b0287c7d889?w=600&h=400&fit=crop',
                'category' => 'dressed_chicken',
                'price_small' => 200, 'price_medium' => 240, 'price_large' => 280, 'price_jumbo' => 320,
                'stock' => 40,
                'stock_small' => 10, 'stock_medium' => 15, 'stock_large' => 10, 'stock_jumbo' => 5,
                'farm_origin' => 'Santos Poultry Farm, Roxas City, Capiz',
                'rating' => 4.8,
            ],
        ];

        foreach ($products as $product) {
            Product::firstOrCreate(
                ['farm_id' => $farm->id, 'name' => $product['name']],
                $product
            );
        }
    }
}

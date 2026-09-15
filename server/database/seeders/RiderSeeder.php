<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Rider;
use App\Models\Farm;
use Illuminate\Support\Facades\Hash;

class RiderSeeder extends Seeder
{
    public function run(): void
    {
        $farm = Farm::first();
        if (!$farm) {
            $seller = User::where('role', 'seller')->first();
            if (!$seller) {
                $seller = User::create([
                    'fullname' => 'Test Seller',
                    'username' => 'testseller',
                    'email' => 'seller@test.com',
                    'password' => Hash::make('password123'),
                    'role' => 'seller',
                    'status' => 'active',
                ]);
            }
            $farm = Farm::create([
                'user_id' => $seller->id,
                'name' => 'Demo Farm',
                'permit_status' => 'approved',
                'location' => 'Demo Location',
                'rating' => 5.0,
            ]);
        }

        $user = User::updateOrCreate(
            ['username' => 'papa'],
            [
                'fullname' => 'Papa Rider',
                'email' => 'papa@poultrylink.test',
                'password' => Hash::make('password123'),
                'role' => 'rider',
                'status' => 'active',
            ]
        );

        Rider::updateOrCreate(
            ['user_id' => $user->id],
            [
                'farm_id' => $farm->id,
                'fullname' => $user->fullname,
                'phone' => '09123456789',
            ]
        );
    }
}

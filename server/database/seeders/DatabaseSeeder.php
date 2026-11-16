<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'fullname' => 'Admin User',
                'email' => 'admin@poultrylink.com',
                'phone' => '09123456789',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call(PlanSeeder::class);

       User::create([
            'name' => 'Admin',
            'email' => 'TbW4w@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
       ]);

       User::create([
            'name' => 'User',
            'email' => 'Oj3o6@example.com',
            'password' => bcrypt('password'),
            'role' => 'user',
            'plan_id' => 1,
            'pdf_count' => 3,
            'pdf_count_reset_at' => now()->addDays(30),
         ]);
    }
}

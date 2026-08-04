<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Plan::query()->delete();

        Plan::create([
            'name' => 'Free',
            'slug' => 'free',
            'description' => 'Free plan with limited features.',
            'price' => 0,
            'pdf_limit' => 5,
            'features' => json_encode(['Basic PDF summarization']),
            'is_active' => true,
        ]);

        Plan::create([
            'name' => 'Standard',
            'slug' => 'standard',
            'description' => 'Standard plan with basic features.',
            'price' => 4.99,
            'pdf_limit' => 20,
            'features' => json_encode(['Basic PDF summarization', 'Email support']),
            'is_active' => true,
        ]);

        Plan::create([
            'name' => 'Premium',
            'slug' => 'premium',
            'description' => 'Premium plan with advanced features.',
            'price' => 9.99,
            'pdf_limit' => -1,
            'features' => json_encode(['Advanced PDF summarization', 'Priority support']),
            'is_active' => true,
        ]);
    }
}

<?php

namespace Database\Factories;

use App\Models\PdfSummary;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PdfSummary>
 */
class PdfSummaryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'filename' => fake()->word().'.pdf',
            'summary' => fake()->paragraph(),
            'file_size' => fake()->numberBetween(1024, 1048576),
        ];
    }
}

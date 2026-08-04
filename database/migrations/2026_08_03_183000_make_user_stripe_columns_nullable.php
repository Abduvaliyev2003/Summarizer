<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE users ALTER COLUMN stripe_customer_id DROP NOT NULL');
        DB::statement('ALTER TABLE users ALTER COLUMN stripe_subscription_id DROP NOT NULL');
        DB::statement('ALTER TABLE users ALTER COLUMN subscription_ends_at DROP NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE users ALTER COLUMN stripe_customer_id SET NOT NULL');
        DB::statement('ALTER TABLE users ALTER COLUMN stripe_subscription_id SET NOT NULL');
        DB::statement('ALTER TABLE users ALTER COLUMN subscription_ends_at SET NOT NULL');
    }
};

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
        Schema::table('pdf_summaries', function (Blueprint $table) {
            $table->string('target_language')->default('en')->after('summary');
            $table->string('source_url')->nullable()->after('target_language');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdf_summaries', function (Blueprint $table) {
            $table->dropColumn(['target_language', 'source_url']);
        });
    }
};

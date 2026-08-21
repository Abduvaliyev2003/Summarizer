<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pdf_summaries', function (Blueprint $table) {
            $table->longText('source_text')->nullable()->after('summary');
            $table->json('source_pages')->nullable()->after('source_text');
        });
    }

    public function down(): void
    {
        Schema::table('pdf_summaries', function (Blueprint $table) {
            $table->dropColumn(['source_text', 'source_pages']);
        });
    }
};

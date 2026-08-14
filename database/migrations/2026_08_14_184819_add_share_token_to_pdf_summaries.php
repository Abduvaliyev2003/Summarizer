<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pdf_summaries', function (Blueprint $table) {
            $table->string('share_token', 32)->nullable()->unique()->after('source_url');
            $table->boolean('is_shared')->default(false)->after('share_token');
        });
    }

    public function down(): void
    {
        Schema::table('pdf_summaries', function (Blueprint $table) {
            $table->dropColumn(['share_token', 'is_shared']);
        });
    }
};

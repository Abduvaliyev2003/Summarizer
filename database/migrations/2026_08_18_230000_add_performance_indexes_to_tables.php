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
            $table->index(['user_id', 'created_at'], 'pdf_summaries_user_id_created_at_idx');
            $table->index(['user_id', 'target_language'], 'pdf_summaries_user_id_lang_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('created_at', 'users_created_at_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pdf_summaries', function (Blueprint $table) {
            $table->dropIndex('pdf_summaries_user_id_created_at_idx');
            $table->dropIndex('pdf_summaries_user_id_lang_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_created_at_idx');
        });
    }
};

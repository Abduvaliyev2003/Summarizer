<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('document_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->timestamps();
            $table->unique(['user_id', 'name']);
        });
        Schema::table('pdf_summaries', function (Blueprint $table) {
            $table->foreignId('collection_id')->nullable()->after('user_id')->constrained('document_collections')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pdf_summaries', fn (Blueprint $table) => $table->dropConstrainedForeignId('collection_id'));
        Schema::dropIfExists('document_collections');
    }
};

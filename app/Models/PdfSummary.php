<?php

namespace App\Models;

use Database\Factories\PdfSummaryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PdfSummary extends Model
{
    /** @use HasFactory<PdfSummaryFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'collection_id',
        'filename',
        'summary',
        'source_text',
        'source_pages',
        'target_language',
        'source_url',
        'file_size',
        'share_token',
        'is_shared',
        'status',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'source_pages' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function collection()
    {
        return $this->belongsTo(DocumentCollection::class, 'collection_id');
    }
}

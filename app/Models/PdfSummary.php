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
        'filename',
        'summary',
        'target_language',
        'source_url',
        'file_size',
        'share_token',
        'is_shared',
        'status',
        'error_message',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

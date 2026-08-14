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
        'file_size',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

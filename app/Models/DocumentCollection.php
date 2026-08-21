<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentCollection extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'name'];

    public function user() { return $this->belongsTo(User::class); }
    public function summaries() { return $this->hasMany(PdfSummary::class, 'collection_id'); }
}

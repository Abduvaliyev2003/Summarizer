<?php

namespace App\DTOs;

use App\Http\Requests\SummarizePDFRequest;
use App\Models\User;
use Illuminate\Http\UploadedFile;

readonly class SummarizePdfDTO
{
    public function __construct(
        public ?UploadedFile $file,
        public ?string $pdfUrl,
        public string $summaryType,
        public string $targetLanguage,
        public User $user,
    ) {}

    public static function fromRequest(SummarizePDFRequest $request): self
    {
        return new self(
            file: $request->file('pdf'),
            pdfUrl: $request->input('pdf_url'),
            summaryType: $request->input('summary_type', 'default'),
            targetLanguage: $request->input('target_language', 'en'),
            user: $request->user(),
        );
    }
}

<?php

namespace App\DTOs;

use App\Http\Requests\ComparePDFsRequest;
use App\Models\User;
use Illuminate\Http\UploadedFile;

readonly class ComparePdfsDTO
{
    /**
     * @param  array<int, UploadedFile>  $files
     */
    public function __construct(
        public array $files,
        public string $targetLanguage,
        public User $user,
    ) {}

    public static function fromRequest(ComparePDFsRequest $request): self
    {
        return new self(
            files: $request->file('pdfs', []),
            targetLanguage: $request->input('target_language', 'en'),
            user: $request->user(),
        );
    }
}

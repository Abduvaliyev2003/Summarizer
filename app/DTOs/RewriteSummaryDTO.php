<?php

namespace App\DTOs;

use App\Http\Requests\RewriteSummaryRequest;
use App\Models\User;

readonly class RewriteSummaryDTO
{
    public function __construct(
        public string $summary,
        public string $mode,
        public string $targetLanguage,
        public ?int $summaryId,
        public User $user,
    ) {}

    public static function fromRequest(RewriteSummaryRequest $request): self
    {
        return new self(
            summary: $request->input('summary'),
            mode: $request->input('mode'),
            targetLanguage: $request->input('target_language', 'en'),
            summaryId: $request->filled('summary_id') ? (int) $request->input('summary_id') : null,
            user: $request->user(),
        );
    }
}

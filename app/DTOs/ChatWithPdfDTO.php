<?php

namespace App\DTOs;

use App\Http\Requests\ChatWithPdfRequest;

readonly class ChatWithPdfDTO
{
    /**
     * @param  array<int, array{role: string, content: string}>  $history
     */
    public function __construct(
        public string $question,
        public string $contextSummary,
        public array $history,
    ) {}

    public static function fromRequest(ChatWithPdfRequest $request): self
    {
        return new self(
            question: $request->input('question'),
            contextSummary: $request->input('context_summary'),
            history: $request->input('history', []),
        );
    }
}

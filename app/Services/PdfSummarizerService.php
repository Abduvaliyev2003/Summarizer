<?php

namespace App\Services;

use App\Models\PdfSummary;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;
use RuntimeException;
use Smalot\PdfParser\Parser;

class PdfSummarizerService
{
    /**
     * Available summary prompt templates.
     *
     * @var array<string, string>
     */
    protected array $prompts = [
        'default' => 'Summarize the following text clearly and concisely in plain text format',
        'points' => 'Summarize the following text as bullet points, highlighting key information in a clear list format',
        'highlight' => 'Extract and list the key highlights and most important takeaways from the following text',
        'detailed' => 'Summarize the following text in a detailed and informative manner, including examples and relevant context',
    ];

    /**
     * Process and summarize the given PDF file for a user.
     *
     * @return array{summary: string, id: int, pdfCount: int}
     *
     * @throws InvalidArgumentException|RuntimeException
     */
    public function summarize(UploadedFile $file, User $user, string $summaryType = 'default'): array
    {
        if (! $user->canSummarizePdf()) {
            throw new RuntimeException('You have reached your PDF limit for this month. Please upgrade your plan to continue using our service.', 403);
        }

        $path = $file->store('pdfs');
        $originalName = $file->getClientOriginalName();
        $fileSize = $file->getSize();

        try {
            $parser = new Parser;
            $fullPath = Storage::path($path);
            $pdf = $parser->parseFile($fullPath);
            $text = trim($pdf->getText());

            $text = mb_substr($text, 0, 4000);

            if ($text === '') {
                throw new InvalidArgumentException('Unable to extract text from the PDF file.', 422);
            }

            $apiKey = config('services.openrouter.key');
            if (empty($apiKey)) {
                Log::error('OpenRouter API Key is not set.');
                throw new RuntimeException('OpenRouter API Key is not set.', 500);
            }

            $userPrompt = $this->prompts[$summaryType] ?? $this->prompts['default'];

            $response = Http::timeout(60)
                ->withHeaders([
                    'Authorization' => 'Bearer '.$apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post('https://openrouter.ai/api/v1/chat/completions', [
                    'model' => 'openai/gpt-4o-mini',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a professional PDF summarizer. Provide clear, well-formatted summaries without using markdown formatting, asterisks, or special characters. Use plain text with proper paragraphs.',
                        ],
                        [
                            'role' => 'user',
                            'content' => "{$userPrompt}:\n\n{$text}",
                        ],
                    ],
                ]);

            if (! $response->ok()) {
                Log::error('OpenRouter API error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                $errorData = $response->json();
                $errorMessage = $errorData['error']['message'] ?? 'Failed to generate summary. Please try again later.';
                $statusCode = $response->status() >= 500 ? 502 : 422;

                throw new RuntimeException($errorMessage, $statusCode);
            }

            $data = $response->json();
            $summaryText = $data['choices'][0]['message']['content'] ?? null;

            if (empty($summaryText)) {
                Log::error('OpenRouter API response missing content', ['response' => $data]);
                throw new RuntimeException('Unable to generate summary. Please try again later.', 500);
            }

            $pdfSummary = PdfSummary::create([
                'user_id' => $user->id,
                'filename' => $originalName,
                'summary' => $summaryText,
                'file_size' => $fileSize,
            ]);

            $user->increment('pdf_count');

            return [
                'summary' => $summaryText,
                'id' => $pdfSummary->id,
                'pdfCount' => (int) $user->fresh()->pdf_count,
            ];
        } finally {
            // Ensure temporary PDF file is cleaned up from disk
            if (Storage::exists($path)) {
                Storage::delete($path);
            }
        }
    }
}

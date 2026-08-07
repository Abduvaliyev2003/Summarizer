<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Smalot\PdfParser\Parser;

class PDFSummarizeController extends Controller
{
     public function summarize(Request $request)
     {
        $file = $request->file('pdf');

        if (!$file || !$file->isValid()) {
            $errorCode = $file?->getError() ?? ($_FILES['pdf']['error'] ?? null);
            $message = 'The PDF failed to upload. Please try again.';

            if ($errorCode === UPLOAD_ERR_INI_SIZE || $errorCode === UPLOAD_ERR_FORM_SIZE) {
                $message = 'The PDF file is too large. Please upload a file smaller than 20 MB.';
            } elseif ($errorCode === UPLOAD_ERR_PARTIAL) {
                $message = 'The PDF was only partially uploaded. Please try again.';
            } elseif ($errorCode === UPLOAD_ERR_NO_FILE) {
                $message = 'No PDF file was uploaded. Please select a PDF file and try again.';
            }

            return response()->json([
                'message' => $message,
            ], 422);
        }

        $request->validate([
            'pdf' => 'required|mimetypes:application/pdf|max:20480',
        ]);

        $user = auth()->user();
        if(!$user->canSummarizePdf()) {
            return response()->json([
                'message' => 'You have reached your PDF limit for this month. Please upgrade your plan to continue using our service.',
            ], 403);
        }

        try {
            $file = $request->file('pdf');
            $path = $file->store('pdfs');
            $originalName = $file->getClientOriginalName();

            $parser = new Parser();
            $pdf = $parser->parseFile(Storage::path($path));
            $text = trim($pdf->getText());

            $text = mb_substr($text, 0, 4000);

            if ($text === '') {
                Storage::delete($path);
                return response()->json([
                    'message' => 'Unable to extract text from the PDF file.',
                ], 422);
            }

            $apiKey  = config('services.openrouter.key');
            if(empty($apiKey)) {
                \Log::error('OpenRouter API Key is not set.');
                Storage::delete($path);
                return response()->json([
                    'message' => 'OpenRouter API Key is not set.',
                ], 500);
            }

            $summaryType = $request->input('summary_type', 'default');

            $prompts = [
                'default' => 'Summarize the following text clearly and concisely in plain text format',
                'points' => 'Summarize the following text as bullet points, highlighting key information in a clear list format',
                'highlight' => 'Extract and list the key highlights and most important takeaways from the following text',
                'detailed' => 'Summarize the following text in a detailed and informative manner, including examples and relevant context',
            ];

            $userPrompt = $prompts[$summaryType] ?? $prompts['default'];

            $response = Http::timeout(60)
            ->withHeaders([
                'Authorization' => 'Bearer ' . $apiKey,
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

            if (!$response->ok()) {
                $errorBody = $response->body();
                $statusCode = $response->status();

                \Log::error("OpenRouter API error", [
                    'status' => $statusCode,
                    'body' => $errorBody,
                ]);

                Storage::delete($path);
                
                $errorData = $response->json();
                $errorMessage = $errorData['error']['message'] ?? 'Failed to generate summary. Please try again later.';
                return  response()->json([
                    'message' => $errorMessage,
                ], $statusCode >= 500 ? 502 : 422);
            }
            $data = $response->json();

            if (!isset($data['choices'][0]['message']['content'])) {
                \Log::error("OpenRouter API response missing content", [
                    'response' => $data,
                ]);
                Storage::delete($path);
                return response()->json([
                    'message' => 'Unable to generate summary. Please try again later.',
                ], 500);
            }

            $summaryText = $data['choices'][0]['message']['content'];

            $pdfSummary = \App\Models\PdfSummary::create([
                'user_id' => $user->id,
                'filename' => $originalName,
                'summary' => $summaryText,
                'file_size' => $file->getSize(),
            ]);

            return response()->json([
                'summary' => $summaryText,
                'id' => $pdfSummary->id,
            ]);

           
        } catch (\Exception $e) {
            \Log::error('Failed to generate summary', [
                'trace' => $e->getTraceAsString(),
            ]);
            if (isset($path))
            {
                Storage::delete($path);
            }
            
            return response()->json([
                'message' => 'Failed to generate summary. Please try again later.',
            ], 500);
        }
     }
}

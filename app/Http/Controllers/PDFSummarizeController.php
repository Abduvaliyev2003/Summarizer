<?php

namespace App\Http\Controllers;

use App\Services\PdfSummarizerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;
use RuntimeException;

class PDFSummarizeController extends Controller
{
    /**
     * Handle PDF document upload or PDF URL submission and generate summary.
     */
    public function summarize(Request $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $file = $request->file('pdf');
        $hasUrl = filled($request->input('pdf_url'));
        $hasFile = $file !== null;

        if (! $hasFile && ! $hasUrl) {
            return response()->json(['message' => 'Please upload a PDF file or provide a valid PDF link (URL).'], 422);
        }

        if ($hasFile && ! $file->isValid()) {
            $errorCode = $file->getError();

            $message = match ($errorCode) {
                UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'The PDF file is too large. Please upload a file smaller than 20 MB.',
                UPLOAD_ERR_PARTIAL => 'The PDF was only partially uploaded. Please try again.',
                UPLOAD_ERR_NO_FILE => 'No PDF file was received. Please select a file and try again.',
                default => 'The PDF failed to upload (error '.$errorCode.'). Please try again.',
            };

            return response()->json(['message' => $message], 422);
        }

        $request->validate([
            'pdf' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'pdf_url' => ['nullable', 'url'],
            'summary_type' => ['nullable', 'string', 'in:default,points,highlight,detailed,quiz'],
            'target_language' => ['nullable', 'string', 'in:uz,en,ru,de,es,fr,tr'],
        ]);

        $user = $request->user();
        $summaryType = $request->input('summary_type', 'default');
        $targetLanguage = $request->input('target_language', 'en');

        try {
            if ($hasUrl && ! $hasFile) {
                $result = $summarizerService->summarizeFromUrl($request->input('pdf_url'), $user, $summaryType, $targetLanguage);
            } else {
                $result = $summarizerService->summarize($file, $user, $summaryType, $targetLanguage);
            }

            return response()->json($result);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (RuntimeException $e) {
            $status = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;

            return response()->json(['message' => $e->getMessage()], $status);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate summary: '.$e->getMessage()], 500);
        }
    }

    /**
     * Handle multi-PDF comparison (2 to 3 files).
     */
    public function compare(Request $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $files = $request->file('pdfs');

        if (! is_array($files) || count($files) < 2 || count($files) > 3) {
            return response()->json(['message' => 'Please select between 2 and 3 PDF files for comparison.'], 422);
        }

        $request->validate([
            'pdfs' => ['required', 'array', 'min:2', 'max:3'],
            'pdfs.*' => ['required', 'file', 'mimes:pdf', 'max:20480'],
            'target_language' => ['nullable', 'string', 'in:uz,en,ru,de,es,fr,tr'],
        ]);

        $user = $request->user();
        $targetLanguage = $request->input('target_language', 'en');

        try {
            $result = $summarizerService->comparePdfs($files, $user, $targetLanguage);

            return response()->json($result);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (RuntimeException $e) {
            $status = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;

            return response()->json(['message' => $e->getMessage()], $status);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate comparison: '.$e->getMessage()], 500);
        }
    }

    /**
     * Handle AI Rewrite & Improve for summary content.
     */
    public function rewrite(Request $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $request->validate([
            'summary' => ['required', 'string'],
            'mode' => ['required', 'string', 'in:simpler,professional,shorter,bullets,translate'],
            'target_language' => ['nullable', 'string', 'in:uz,en,ru,de,es,fr,tr'],
            'summary_id' => [
                'nullable',
                'integer',
                Rule::exists('pdf_summaries', 'id')->where('user_id', $request->user()->id),
            ],
        ]);

        $text = $request->input('summary');
        $mode = $request->input('mode');
        $targetLanguage = $request->input('target_language', 'en');

        try {
            $rewrittenText = $summarizerService->rewriteSummary($text, $mode, $targetLanguage);

            if ($request->filled('summary_id')) {
                $pdfSummary = $request->user()->pdfSummaries()->find($request->input('summary_id'));
                if ($pdfSummary) {
                    $pdfSummary->update(['summary' => $rewrittenText]);
                }
            }

            return response()->json([
                'summary' => $rewrittenText,
                'mode' => $mode,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to rewrite summary: '.$e->getMessage()], 500);
        }
    }

    /**
     * Handle Chat with PDF Q&A.
     */
    public function chat(Request $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $request->validate([
            'question' => ['required', 'string', 'max:1000'],
            'context_summary' => ['required', 'string'],
            'history' => ['nullable', 'array'],
            'history.*.role' => ['required_with:history', 'string', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string'],
        ]);

        $question = $request->input('question');
        $contextSummary = $request->input('context_summary');
        $history = $request->input('history', []);

        try {
            $answer = $summarizerService->chatWithPdf($question, $contextSummary, $history);

            return response()->json([
                'answer' => $answer,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to process chat question: '.$e->getMessage()], 500);
        }
    }
}

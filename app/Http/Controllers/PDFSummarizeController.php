<?php

namespace App\Http\Controllers;

use App\Services\PdfSummarizerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        $hasFileAttempt = $file !== null || isset($_FILES['pdf']);
        $hasUrl = filled($request->input('pdf_url'));

        if (! $hasFileAttempt && ! $hasUrl) {
            return response()->json(['message' => 'Please upload a PDF file or provide a valid PDF link (URL).'], 422);
        }

        if ($hasFileAttempt) {
            if (! $file || ! $file->isValid()) {
                $errorCode = $file?->getError() ?? ($_FILES['pdf']['error'] ?? null);
                $message = 'The PDF failed to upload. Please try again.';

                if ($errorCode === UPLOAD_ERR_INI_SIZE || $errorCode === UPLOAD_ERR_FORM_SIZE) {
                    $message = 'The PDF file is too large for the server upload limit. Please select a smaller PDF file.';
                } elseif ($errorCode === UPLOAD_ERR_PARTIAL) {
                    $message = 'The PDF was only partially uploaded. Please try again.';
                } elseif ($errorCode === UPLOAD_ERR_NO_FILE) {
                    $message = 'No PDF file was uploaded. Please select a PDF file and try again.';
                }

                return response()->json(['message' => $message], 422);
            }
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
            if ($hasUrl && ! $file) {
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
}

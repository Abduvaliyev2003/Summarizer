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
     * Handle PDF document upload and summary generation.
     */
    public function summarize(Request $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $file = $request->file('pdf');

        if (! $file || ! $file->isValid()) {
            $errorCode = $file?->getError() ?? ($_FILES['pdf']['error'] ?? null);
            $message = 'The PDF failed to upload. Please try again.';

            if ($errorCode === UPLOAD_ERR_INI_SIZE || $errorCode === UPLOAD_ERR_FORM_SIZE) {
                $message = 'The PDF file is too large. Please upload a file smaller than 20 MB.';
            } elseif ($errorCode === UPLOAD_ERR_PARTIAL) {
                $message = 'The PDF was only partially uploaded. Please try again.';
            } elseif ($errorCode === UPLOAD_ERR_NO_FILE) {
                $message = 'No PDF file was uploaded. Please select a PDF file and try again.';
            }

            return response()->json(['message' => $message], 422);
        }

        $request->validate([
            'pdf' => ['required', 'mimetypes:application/pdf', 'max:20480'],
            'summary_type' => ['nullable', 'string', 'in:default,points,highlight,detailed'],
        ]);

        $user = $request->user();
        $summaryType = $request->input('summary_type', 'default');

        try {
            $result = $summarizerService->summarize($file, $user, $summaryType);

            return response()->json($result);
        } catch (InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (RuntimeException $e) {
            $status = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;

            return response()->json(['message' => $e->getMessage()], $status);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate summary. Please try again later.'], 500);
        }
    }
}

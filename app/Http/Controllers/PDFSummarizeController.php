<?php

namespace App\Http\Controllers;

use App\DTOs\ChatWithPdfDTO;
use App\DTOs\ComparePdfsDTO;
use App\DTOs\RewriteSummaryDTO;
use App\DTOs\SummarizePdfDTO;
use App\Http\Requests\ChatWithPdfRequest;
use App\Http\Requests\ComparePDFsRequest;
use App\Http\Requests\RewriteSummaryRequest;
use App\Http\Requests\SummarizePDFRequest;
use App\Services\PdfSummarizerService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;
use RuntimeException;

class PDFSummarizeController extends Controller
{
    /**
     * Handle PDF document upload or PDF URL submission and generate summary.
     */
    public function summarize(SummarizePDFRequest $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $dto = SummarizePdfDTO::fromRequest($request);

        try {
            if ($dto->pdfUrl && ! $dto->file) {
                $result = $summarizerService->summarizeFromUrl($dto->pdfUrl, $dto->user, $dto->summaryType, $dto->targetLanguage);
            } else {
                $result = $summarizerService->summarize($dto);
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
    public function compare(ComparePDFsRequest $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $dto = ComparePdfsDTO::fromRequest($request);

        try {
            $result = $summarizerService->comparePdfs($dto);

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
    public function rewrite(RewriteSummaryRequest $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $dto = RewriteSummaryDTO::fromRequest($request);

        try {
            $rewrittenText = $summarizerService->rewriteSummary($dto);

            if ($dto->summaryId) {
                $pdfSummary = $dto->user->pdfSummaries()->find($dto->summaryId);
                if ($pdfSummary) {
                    $pdfSummary->update(['summary' => $rewrittenText]);
                }
            }

            return response()->json([
                'summary' => $rewrittenText,
                'mode' => $dto->mode,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to rewrite summary: '.$e->getMessage()], 500);
        }
    }

    /**
     * Handle Chat with PDF Q&A.
     */
    public function chat(ChatWithPdfRequest $request, PdfSummarizerService $summarizerService): JsonResponse
    {
        $dto = ChatWithPdfDTO::fromRequest($request);

        try {
            $answer = $summarizerService->chatWithPdf($dto);

            return response()->json([
                'answer' => $answer,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to process chat question: '.$e->getMessage()], 500);
        }
    }

    /**
     * Get processing status of an asynchronous PDF summary task.
     */
    public function status(\App\Models\PdfSummary $summary): JsonResponse
    {
        return response()->json([
            'id' => $summary->id,
            'status' => $summary->status,
            'summary' => $summary->summary,
            'errorMessage' => $summary->error_message,
        ]);
    }
}

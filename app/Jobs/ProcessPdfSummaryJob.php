<?php

namespace App\Jobs;

use App\Models\PdfSummary;
use App\Services\DashboardStatsService;
use App\Services\PdfSummarizerService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessPdfSummaryJob implements ShouldQueue
{
    use InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 180;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $pdfSummaryId,
        public string $tempStoragePath,
        public string $summaryType = 'default',
        public string $targetLanguage = 'en',
    ) {}

    /**
     * Execute the job.
     */
    public function handle(PdfSummarizerService $summarizerService): void
    {
        $summary = PdfSummary::find($this->pdfSummaryId);
        if (! $summary) {
            return;
        }

        $summary->update(['status' => 'processing']);

        try {
            $fullPath = storage_path('app/'.$this->tempStoragePath);
            $extractedSummary = $summarizerService->extractAndSummarizeText(
                $fullPath,
                $this->summaryType,
                $this->targetLanguage
            );

            $summary->update([
                'summary' => $extractedSummary,
                'status' => 'completed',
            ]);

            DashboardStatsService::clearDashboardCache($summary->user_id);
        } catch (Throwable $e) {
            Log::error('ProcessPdfSummaryJob error', ['summary_id' => $this->pdfSummaryId, 'error' => $e->getMessage()]);

            $summary->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}

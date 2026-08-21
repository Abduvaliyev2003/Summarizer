<?php

namespace App\Http\Controllers;

use App\Models\DocumentCollection;
use App\Models\PdfSummary;
use App\Services\PdfSummarizerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DocumentCollectionController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        return Inertia::render('workspaces', [
            'collections' => $user->documentCollections()->with(['summaries:id,collection_id,filename'])->withCount('summaries')->latest()->get(),
            'summaries' => $user->pdfSummaries()->select('id', 'filename', 'collection_id')->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:80']]);
        $request->user()->documentCollections()->create($data);
        return back();
    }

    public function assign(Request $request, PdfSummary $summary)
    {
        abort_unless($summary->user_id === $request->user()->id, 403);
        $data = $request->validate(['collection_id' => ['nullable', 'integer']]);
        if ($data['collection_id'] ?? null) abort_unless($request->user()->documentCollections()->whereKey($data['collection_id'])->exists(), 403);
        $summary->update(['collection_id' => $data['collection_id'] ?? null]);
        return back();
    }

    public function chat(Request $request, DocumentCollection $collection, PdfSummarizerService $service): JsonResponse
    {
        abort_unless($collection->user_id === $request->user()->id, 403);
        $data = $request->validate(['question' => ['required', 'string', 'max:1000'], 'history' => ['nullable', 'array']]);
        $context = $collection->summaries()->limit(8)->get()->map(fn (PdfSummary $summary) => "DOCUMENT: {$summary->filename}\n".mb_substr($summary->source_text ?: $summary->summary, 0, 8000))->implode("\n\n---\n\n");
        return response()->json(['answer' => $service->chatWithPdf($data['question'], $context, $data['history'] ?? [])]);
    }
}

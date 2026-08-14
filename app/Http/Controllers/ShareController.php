<?php

namespace App\Http\Controllers;

use App\Models\PdfSummary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ShareController extends Controller
{
    /**
     * Display a publicly shared PDF summary by its share token.
     */
    public function show(string $token): Response
    {
        $summary = PdfSummary::where('share_token', $token)
            ->where('is_shared', true)
            ->firstOrFail();

        return Inertia::render('Share', [
            'summary' => [
                'id' => $summary->id,
                'filename' => $summary->filename,
                'summary' => $summary->summary,
                'target_language' => $summary->target_language,
                'created_at' => $summary->created_at->format('M d, Y'),
            ],
        ]);
    }

    /**
     * Generate or revoke a public share link for an authenticated user's summary.
     */
    public function toggle(Request $request, PdfSummary $summary): JsonResponse
    {
        // Ensure the summary belongs to the authenticated user
        if ($summary->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($summary->is_shared) {
            // Revoke the share
            $summary->update([
                'is_shared' => false,
                'share_token' => null,
            ]);

            return response()->json([
                'shared' => false,
                'share_url' => null,
            ]);
        }

        // Generate a unique share token
        $token = Str::random(16);
        while (PdfSummary::where('share_token', $token)->exists()) {
            $token = Str::random(16);
        }

        $summary->update([
            'is_shared' => true,
            'share_token' => $token,
        ]);

        return response()->json([
            'shared' => true,
            'share_url' => url("/s/{$token}"),
        ]);
    }
}

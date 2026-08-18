<?php

namespace App\Http\Controllers;

use App\Services\StripeSubscriptionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function __construct(protected StripeSubscriptionService $stripeService) {}

    /**
     * Handle incoming Stripe webhook requests with signature verification.
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret') ?? env('STRIPE_WEBHOOK_SECRET');

        if (empty($webhookSecret)) {
            Log::warning('STRIPE_WEBHOOK_SECRET is not configured.');

            return response()->json(['message' => 'Webhook secret not configured'], 400);
        }

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            $this->stripeService->handleWebhookEvent($event);

            return response()->json(['status' => 'success']);
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe webhook signature verification failed: '.$e->getMessage());

            return response()->json(['error' => 'Invalid signature'], 400);
        } catch (\UnexpectedValueException $e) {
            Log::error('Stripe webhook invalid payload: '.$e->getMessage());

            return response()->json(['error' => 'Invalid payload'], 400);
        } catch (\Exception $e) {
            Log::error('Stripe webhook processing error: '.$e->getMessage());

            return response()->json(['error' => 'Webhook handler error'], 500);
        }
    }
}

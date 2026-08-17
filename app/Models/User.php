<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'plan_id',
        'pdf_count',
        'pdf_count_reset_at',
        'stripe_customer_id',
        'stripe_subscription_id',
        'subscription_ends_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'stripe_customer_id',
        'stripe_subscription_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',

            // IMPORTANT
            'pdf_count_reset_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if (! $user->plan_id) {
                $freePlan = Plan::where('slug', 'free')->first();

                if ($freePlan) {
                    $user->plan_id = $freePlan->id;
                    $user->pdf_count = 0;
                    $user->pdf_count_reset_at = now()->addDays(30);
                }
            }
        });
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function pdfSummaries()
    {
        return $this->hasMany(PdfSummary::class);
    }

    public function canSummarizePdf(): bool
    {
        if (! $this->plan_id) {
            $freePlan = Plan::where('slug', 'free')->first();
            if ($freePlan) {
                $this->update([
                    'plan_id' => $freePlan->id,
                    'pdf_count_reset_at' => $this->pdf_count_reset_at ?? now()->addDays(30),
                ]);
                $this->load('plan');
            }
        } elseif (! $this->relationLoaded('plan')) {
            $this->load('plan');
        }

        if (! $this->plan) {
            return false;
        }

        if (
            $this->pdf_count_reset_at &&
            $this->pdf_count_reset_at->isPast()
        ) {
            $this->update([
                'pdf_count' => 0,
                'pdf_count_reset_at' => now()->addDays(30),
            ]);

            // Refresh model values after update
            $this->refresh();
        }

        // -1 means unlimited
        if ($this->plan->pdf_limit < 0) {
            return true;
        }

        return $this->pdf_count < $this->plan->pdf_limit;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function hasActiveSubscription(): bool
    {
        if (! $this->stripe_subscription_id) {
            return false;
        }

        if (
            $this->subscription_ends_at &&
            $this->subscription_ends_at->isPast()
        ) {
            return false;
        }

        return true;
    }

    public function canChangePlan(): bool
    {
        return ! $this->hasActiveSubscription();
    }
}

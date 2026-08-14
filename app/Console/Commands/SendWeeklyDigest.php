<?php

namespace App\Console\Commands;

use App\Mail\WeeklyDigestMail;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class SendWeeklyDigest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'digest:weekly';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send weekly summary activity digest emails to active users';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $oneWeekAgo = now()->subDays(7);

        $users = User::whereHas('pdfSummaries', function ($query) use ($oneWeekAgo) {
            $query->where('created_at', '>=', $oneWeekAgo);
        })->get();

        $count = 0;
        foreach ($users as $user) {
            $summaries = $user->pdfSummaries()
                ->where('created_at', '>=', $oneWeekAgo)
                ->latest()
                ->get();

            if ($summaries->isNotEmpty()) {
                Mail::to($user->email)->queue(new WeeklyDigestMail($user, $summaries));
                $count++;
            }
        }

        $this->info("Successfully queued weekly digest emails for {$count} users.");

        return Command::SUCCESS;
    }
}

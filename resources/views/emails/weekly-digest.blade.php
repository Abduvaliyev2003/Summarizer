<x-mail::message>
# Hello {{ $user->name }}, 👋

Here is your weekly activity digest from **PDF Summarizer**!

You processed **{{ $totalCount }}** PDF {{ Str::plural('document', $totalCount) }} this past week.

<x-mail::panel>
### 📄 Summaries Breakdown
@foreach($summaries as $summary)
- **{{ $summary->filename }}** ({{ $summary->created_at->format('M d, Y') }})
@endforeach
</x-mail::panel>

Keep learning and turning long documents into quick actionable insights!

<x-mail::button :url="config('app.url') . '/dashboard'">
Go to Dashboard
</x-mail::button>

Thanks,<br>
{{ config('app.name') }} Team
</x-mail::message>

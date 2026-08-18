<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RewriteSummaryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'summary' => ['required', 'string'],
            'mode' => ['required', 'string', 'in:simpler,professional,shorter,bullets,translate'],
            'target_language' => ['nullable', 'string', 'in:uz,en,ru,de,es,fr,tr'],
            'summary_id' => [
                'nullable',
                'integer',
                'exists:pdf_summaries,id,user_id,'.$this->user()?->id,
            ],
        ];
    }
}

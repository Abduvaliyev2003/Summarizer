<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ComparePDFsRequest extends FormRequest
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
            'pdfs' => ['required', 'array', 'min:2', 'max:3'],
            'pdfs.*' => ['required', 'file', 'mimes:pdf', 'max:20480'],
            'target_language' => ['nullable', 'string', 'in:uz,en,ru,de,es,fr,tr'],
        ];
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pdfs.required' => 'Please select between 2 and 3 PDF files for comparison.',
            'pdfs.min' => 'Please select at least 2 PDF files for comparison.',
            'pdfs.max' => 'You can compare a maximum of 3 PDF files at once.',
            'pdfs.*.mimes' => 'All selected files must be valid PDF documents.',
            'pdfs.*.max' => 'Each PDF file must be smaller than 20 MB.',
        ];
    }
}

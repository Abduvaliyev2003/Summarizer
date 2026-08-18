<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SummarizePDFRequest extends FormRequest
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
            'pdf' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'pdf_url' => ['nullable', 'url'],
            'summary_type' => ['nullable', 'string', 'in:default,points,highlight,detailed,quiz'],
            'target_language' => ['nullable', 'string', 'in:uz,en,ru,de,es,fr,tr'],
        ];
    }

    /**
     * Configure additional validation hooks.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $hasFile = $this->hasFile('pdf');
            $hasUrl = filled($this->input('pdf_url'));

            if (! $hasFile && ! $hasUrl) {
                $validator->errors()->add('pdf', 'Please upload a PDF file or provide a valid PDF link (URL).');

                return;
            }

            if ($hasFile) {
                $file = $this->file('pdf');
                if ($file && ! $file->isValid()) {
                    $errorCode = $file->getError();
                    $message = match ($errorCode) {
                        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'The PDF file is too large. Please upload a file smaller than 20 MB.',
                        UPLOAD_ERR_PARTIAL => 'The PDF was only partially uploaded. Please try again.',
                        UPLOAD_ERR_NO_FILE => 'No PDF file was received. Please select a file and try again.',
                        default => 'The PDF failed to upload (error '.$errorCode.'). Please try again.',
                    };
                    $validator->errors()->add('pdf', $message);
                }
            }
        });
    }
}

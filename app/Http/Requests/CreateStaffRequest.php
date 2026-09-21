<?php

namespace App\Http\Requests;

use App\Models\StaffProfile;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Class CreateStaffRequest
 */
class CreateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return StaffProfile::$rules;
    }
}

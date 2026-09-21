<?php

namespace App\Http\Requests;

use App\Models\StaffIncentivePayout;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Class CreateStaffIncentivePayoutRequest
 */
class CreateStaffIncentivePayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return StaffIncentivePayout::$rules;
    }
}

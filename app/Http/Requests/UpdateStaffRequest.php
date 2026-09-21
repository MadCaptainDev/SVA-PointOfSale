<?php

namespace App\Http\Requests;

use App\Models\StaffProfile;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Class UpdateStaffRequest
 */
class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staffParam = $this->route('staff');
        $staff = $staffParam instanceof StaffProfile
            ? $staffParam
            : StaffProfile::find($staffParam);
        $userId = $staff?->user_id;

        $rules = StaffProfile::$rules;
        $rules['email'] = 'required|email|unique:users,email,'.$userId;
        $rules['phone'] = 'required|numeric|unique:users,phone,'.$userId;
        $rules['password'] = 'nullable|min:6';
        $rules['confirm_password'] = 'nullable|min:6|same:password';
        $rules['employee_code'] = 'nullable|string|unique:staff_profiles,employee_code,'.($staff?->id);

        return $rules;
    }
}

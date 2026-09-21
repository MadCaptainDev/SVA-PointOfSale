<?php

namespace App\Models;

use App\Traits\HasJsonResourcefulData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class StaffProfile
 */
class StaffProfile extends BaseModel
{
    use HasFactory, HasJsonResourcefulData;

    protected $table = 'staff_profiles';

    const JSON_API_TYPE = 'staff_profiles';

    protected $fillable = [
        'user_id',
        'employee_code',
        'job_title',
        'department',
        'joined_at',
        'base_salary',
        'commission_rate',
        'notes',
    ];

    protected $casts = [
        'joined_at' => 'date',
        'base_salary' => 'decimal:2',
        'commission_rate' => 'decimal:4',
    ];

    public static $rules = [
        'first_name' => 'required',
        'last_name' => 'required',
        'email' => 'required|email|unique:users',
        'phone' => 'required|numeric|unique:users',
        'password' => 'required|min:6',
        'confirm_password' => 'required|min:6|same:password',
        'role_id' => 'required|exists:roles,id',
        'employee_code' => 'nullable|string|unique:staff_profiles,employee_code',
        'job_title' => 'nullable|string|max:255',
        'department' => 'nullable|string|max:255',
        'joined_at' => 'nullable|date',
        'base_salary' => 'nullable|numeric|min:0',
        'commission_rate' => 'nullable|numeric|min:0|max:100',
        'notes' => 'nullable|string',
    ];

    public function prepareLinks(): array
    {
        return [
            'self' => route('staff.show', $this->id),
        ];
    }

    public function prepareAttributes(): array
    {
        $user = $this->user;

        return [
            'user_id' => $this->user_id,
            'first_name' => $user?->first_name,
            'last_name' => $user?->last_name,
            'email' => $user?->email,
            'phone' => $user?->phone,
            'image' => $user?->image_url,
            'role' => $user?->roles,
            'employee_code' => $this->employee_code,
            'job_title' => $this->job_title,
            'department' => $this->department,
            'joined_at' => $this->joined_at,
            'base_salary' => $this->base_salary,
            'commission_rate' => $this->commission_rate,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}

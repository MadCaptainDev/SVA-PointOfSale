<?php

namespace App\Models;

use App\Traits\HasJsonResourcefulData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class StaffIncentivePayout
 */
class StaffIncentivePayout extends BaseModel
{
    use HasFactory, HasJsonResourcefulData;

    protected $table = 'staff_incentive_payouts';

    const JSON_API_TYPE = 'staff_incentive_payouts';

    protected $fillable = [
        'user_id',
        'amount',
        'note',
        'paid_at',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public static $rules = [
        'user_id' => 'required|exists:users,id',
        'amount' => 'required|numeric|min:0.01',
        'note' => 'nullable|string',
        'paid_at' => 'nullable|date',
    ];

    public function prepareLinks(): array
    {
        return [
            'self' => route('staff-incentive-payouts.show', $this->id),
        ];
    }

    public function prepareAttributes(): array
    {
        $user = $this->user;
        $creator = $this->creator;

        return [
            'user_id' => $this->user_id,
            'staff_name' => trim(($user?->first_name ?? '').' '.($user?->last_name ?? '')),
            'amount' => $this->amount,
            'note' => $this->note,
            'paid_at' => $this->paid_at,
            'created_by' => $this->created_by,
            'created_by_name' => trim(($creator?->first_name ?? '').' '.($creator?->last_name ?? '')),
            'created_at' => $this->created_at,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }
}

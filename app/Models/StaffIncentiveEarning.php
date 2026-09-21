<?php

namespace App\Models;

use App\Traits\HasJsonResourcefulData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class StaffIncentiveEarning
 */
class StaffIncentiveEarning extends BaseModel
{
    use HasFactory, HasJsonResourcefulData;

    protected $table = 'staff_incentive_earnings';

    const JSON_API_TYPE = 'staff_incentive_earnings';

    const STATUS_PENDING = 'pending';

    const STATUS_PAID = 'paid';

    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'user_id',
        'sale_id',
        'sale_amount',
        'commission_rate',
        'amount',
        'status',
    ];

    protected $casts = [
        'sale_amount' => 'decimal:2',
        'commission_rate' => 'decimal:4',
        'amount' => 'decimal:2',
    ];

    public static $rules = [
        'user_id' => 'required|exists:users,id',
        'sale_id' => 'required|exists:sales,id|unique:staff_incentive_earnings,sale_id',
        'sale_amount' => 'required|numeric',
        'commission_rate' => 'required|numeric',
        'amount' => 'required|numeric',
        'status' => 'required|in:pending,paid,cancelled',
    ];

    public function prepareLinks(): array
    {
        return [
            'self' => route('staff-incentive-earnings.show', $this->id),
        ];
    }

    public function prepareAttributes(): array
    {
        $user = $this->user;
        $sale = $this->sale;

        return [
            'user_id' => $this->user_id,
            'sale_id' => $this->sale_id,
            'staff_name' => trim(($user?->first_name ?? '').' '.($user?->last_name ?? '')),
            'sale_reference' => $sale?->reference_code,
            'sale_amount' => $this->sale_amount,
            'commission_rate' => $this->commission_rate,
            'amount' => $this->amount,
            'status' => $this->status,
            'created_at' => $this->created_at,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class, 'sale_id', 'id');
    }
}

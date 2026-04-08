<?php

namespace App\Models;

use App\Traits\HasJsonResourcefulData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class CustomerWithdrawal
 */
class CustomerWithdrawal extends BaseModel
{
    use HasFactory, HasJsonResourcefulData;

    protected $table = 'customer_withdrawals';

    const JSON_API_TYPE = 'customer_withdrawals';

    protected $fillable = [
        'customer_id',
        'points',
        'amount',
        'reference_code',
        'date',
    ];

    public static $rules = [
        'customer_id' => 'required|exists:customers,id',
        'points' => 'required|numeric',
        'amount' => 'required|numeric',
        'reference_code' => 'required',
        'date' => 'required|date',
    ];

    public function prepareLinks(): array
    {
        return [
            'self' => route('customer-withdrawals.show', $this->id),
        ];
    }

    public function prepareAttributes(): array
    {
        return [
            'customer_id' => $this->customer_id,
            'points' => $this->points,
            'amount' => $this->amount,
            'reference_code' => $this->reference_code,
            'date' => $this->date,
            'customer_name' => $this->customer->name,
            'created_at' => $this->created_at,
        ];
    }

    /**
     * @return BelongsTo
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class , 'customer_id', 'id');
    }
}

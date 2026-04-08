<?php

namespace App\Models;

use App\Traits\HasJsonResourcefulData;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends BaseModel
{
    use HasFactory, HasJsonResourcefulData;

    protected $table = 'customers';

    const JSON_API_TYPE = 'customers';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'country',
        'city',
        'address',
        'dob',
        'points', // added
    ];

    public static $rules = [
        'name' => 'required',
        'phone' => 'required|numeric',
        'address' => 'required',
    ];

    public function prepareLinks(): array
    {
        return [
            'self' => route('customers.show', $this->id),
        ];
    }

    public function prepareAttributes(): array
    {
        return [
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'country' => $this->country,
            'city' => $this->city,
            'address' => $this->address,
            'dob' => $this->dob,
            'points' => $this->points, // added
            'created_at' => $this->created_at,
        ];
    }

    public function prepareCustomers(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
        ];
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class , 'customer_id', 'id');
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class , 'customer_id', 'id');
    }

    public function salesReturns(): HasMany
    {
        return $this->hasMany(SaleReturn::class , 'customer_id', 'id');
    }

    public function withdrawals(): HasMany
    {
        return $this->hasMany(CustomerWithdrawal::class , 'customer_id', 'id');
    }
}

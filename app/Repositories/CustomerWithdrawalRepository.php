<?php

namespace App\Repositories;

use App\Models\CustomerWithdrawal;

/**
 * Class CustomerWithdrawalRepository
 */
class CustomerWithdrawalRepository extends BaseRepository
{
    /**
     * @var array
     */
    protected $fieldSearchable = [
        'customer_id',
        'points',
        'amount',
        'reference_code',
        'date',
        'created_at',
    ];

    /**
     * Return searchable fields
     */
    public function getFieldsSearchable(): array
    {
        return $this->fieldSearchable;
    }

    /**
     * Configure the Model
     **/
    public function model()
    {
        return CustomerWithdrawal::class;
    }
}

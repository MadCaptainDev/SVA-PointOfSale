<?php

namespace App\Repositories;

use App\Models\StaffIncentiveEarning;
use App\Models\StaffProfile;
use App\Models\Sale;

/**
 * Class StaffIncentiveEarningRepository
 */
class StaffIncentiveEarningRepository extends BaseRepository
{
    /**
     * @var array
     */
    protected $fieldSearchable = [
        'user_id',
        'sale_id',
        'status',
        'amount',
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
        return StaffIncentiveEarning::class;
    }

    /**
     * Record pending commission for a completed sale.
     */
    public function createForSale(Sale $sale): ?StaffIncentiveEarning
    {
        if (empty($sale->user_id) || empty($sale->grand_total)) {
            return null;
        }

        if (StaffIncentiveEarning::where('sale_id', $sale->id)->exists()) {
            return null;
        }

        $rate = $this->resolveCommissionRate($sale->user_id);
        if ($rate <= 0) {
            return null;
        }

        $amount = round(($sale->grand_total * $rate) / 100, 2);
        if ($amount <= 0) {
            return null;
        }

        return StaffIncentiveEarning::create([
            'user_id' => $sale->user_id,
            'sale_id' => $sale->id,
            'sale_amount' => $sale->grand_total,
            'commission_rate' => $rate,
            'amount' => $amount,
            'status' => StaffIncentiveEarning::STATUS_PENDING,
        ]);
    }

    /**
     * Cancel pending earning when a sale is deleted/voided.
     */
    public function cancelForSale(int $saleId): void
    {
        $earning = StaffIncentiveEarning::where('sale_id', $saleId)->first();
        if (! $earning) {
            return;
        }

        if ($earning->status === StaffIncentiveEarning::STATUS_PENDING) {
            $earning->update(['status' => StaffIncentiveEarning::STATUS_CANCELLED]);
        }
    }

    protected function resolveCommissionRate(int $userId): float
    {
        $profile = StaffProfile::where('user_id', $userId)->first();
        if ($profile && $profile->commission_rate !== null && $profile->commission_rate !== '') {
            return (float) $profile->commission_rate;
        }

        $default = getSettingValue('staff_commission_rate');

        return $default !== null && $default !== '' ? (float) $default : 1.0;
    }
}

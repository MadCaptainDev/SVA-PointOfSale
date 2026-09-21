<?php

namespace App\Repositories;

use App\Models\StaffIncentiveEarning;
use App\Models\StaffIncentivePayout;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Class StaffIncentivePayoutRepository
 */
class StaffIncentivePayoutRepository extends BaseRepository
{
    /**
     * @var array
     */
    protected $fieldSearchable = [
        'user_id',
        'amount',
        'paid_at',
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
        return StaffIncentivePayout::class;
    }

    public function createPayout(array $input): StaffIncentivePayout
    {
        try {
            DB::beginTransaction();

            $userId = (int) $input['user_id'];
            $amount = round((float) $input['amount'], 2);

            $pendingTotal = StaffIncentiveEarning::where('user_id', $userId)
                ->where('status', StaffIncentiveEarning::STATUS_PENDING)
                ->sum('amount');

            if ($amount > (float) $pendingTotal) {
                throw new UnprocessableEntityHttpException(
                    'Payout amount exceeds pending commission ('.number_format((float) $pendingTotal, 2).').'
                );
            }

            $payout = $this->create([
                'user_id' => $userId,
                'amount' => $amount,
                'note' => $input['note'] ?? null,
                'paid_at' => $input['paid_at'] ?? Carbon::now(),
                'created_by' => Auth::id(),
            ]);

            $remaining = $amount;
            $earnings = StaffIncentiveEarning::where('user_id', $userId)
                ->where('status', StaffIncentiveEarning::STATUS_PENDING)
                ->orderBy('id')
                ->get();

            foreach ($earnings as $earning) {
                if ($remaining <= 0) {
                    break;
                }
                $earningAmount = (float) $earning->amount;
                if ($earningAmount <= $remaining) {
                    $earning->update(['status' => StaffIncentiveEarning::STATUS_PAID]);
                    $remaining = round($remaining - $earningAmount, 2);
                }
            }

            DB::commit();

            return $payout->load(['user', 'creator']);
        } catch (UnprocessableEntityHttpException $e) {
            DB::rollBack();
            throw $e;
        } catch (Exception $e) {
            DB::rollBack();
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }
}

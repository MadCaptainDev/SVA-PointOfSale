<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\CreateStaffIncentivePayoutRequest;
use App\Http\Resources\StaffIncentivePayoutCollection;
use App\Http\Resources\StaffIncentivePayoutResource;
use App\Repositories\StaffIncentivePayoutRepository;
use Illuminate\Http\Request;

/**
 * Class StaffIncentivePayoutAPIController
 */
class StaffIncentivePayoutAPIController extends AppBaseController
{
    /** @var StaffIncentivePayoutRepository */
    private $staffIncentivePayoutRepository;

    public function __construct(StaffIncentivePayoutRepository $staffIncentivePayoutRepository)
    {
        $this->staffIncentivePayoutRepository = $staffIncentivePayoutRepository;
    }

    public function index(Request $request): StaffIncentivePayoutCollection
    {
        $perPage = getPageSize($request);
        $payouts = $this->staffIncentivePayoutRepository->with(['user', 'creator'])->paginate($perPage);
        StaffIncentivePayoutResource::usingWithCollection();

        return new StaffIncentivePayoutCollection($payouts);
    }

    public function store(CreateStaffIncentivePayoutRequest $request): StaffIncentivePayoutResource
    {
        $input = $request->all();
        $payout = $this->staffIncentivePayoutRepository->createPayout($input);

        return new StaffIncentivePayoutResource($payout);
    }

    public function show($id): StaffIncentivePayoutResource
    {
        $payout = $this->staffIncentivePayoutRepository->with(['user', 'creator'])->find($id);

        return new StaffIncentivePayoutResource($payout);
    }
}

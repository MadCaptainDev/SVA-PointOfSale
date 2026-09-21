<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Resources\StaffIncentiveEarningCollection;
use App\Http\Resources\StaffIncentiveEarningResource;
use App\Repositories\StaffIncentiveEarningRepository;
use Illuminate\Http\Request;

/**
 * Class StaffIncentiveEarningAPIController
 */
class StaffIncentiveEarningAPIController extends AppBaseController
{
    /** @var StaffIncentiveEarningRepository */
    private $staffIncentiveEarningRepository;

    public function __construct(StaffIncentiveEarningRepository $staffIncentiveEarningRepository)
    {
        $this->staffIncentiveEarningRepository = $staffIncentiveEarningRepository;
    }

    public function index(Request $request): StaffIncentiveEarningCollection
    {
        $perPage = getPageSize($request);
        $earnings = $this->staffIncentiveEarningRepository->with(['user', 'sale'])->paginate($perPage);
        StaffIncentiveEarningResource::usingWithCollection();

        return new StaffIncentiveEarningCollection($earnings);
    }

    public function show($id): StaffIncentiveEarningResource
    {
        $earning = $this->staffIncentiveEarningRepository->with(['user', 'sale'])->find($id);

        return new StaffIncentiveEarningResource($earning);
    }
}

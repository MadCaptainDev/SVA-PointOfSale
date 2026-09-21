<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Requests\CreateStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\StaffCollection;
use App\Http\Resources\StaffResource;
use App\Models\StaffProfile;
use App\Repositories\StaffRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Class StaffAPIController
 */
class StaffAPIController extends AppBaseController
{
    /** @var StaffRepository */
    private $staffRepository;

    public function __construct(StaffRepository $staffRepository)
    {
        $this->staffRepository = $staffRepository;
    }

    public function index(Request $request): StaffCollection
    {
        $perPage = getPageSize($request);
        $staff = $this->staffRepository->with(['user.roles'])->paginate($perPage);
        StaffResource::usingWithCollection();

        return new StaffCollection($staff);
    }

    public function store(CreateStaffRequest $request): StaffResource
    {
        $input = $request->all();
        $staff = $this->staffRepository->storeStaff($input);

        return new StaffResource($staff);
    }

    public function show($id): StaffResource
    {
        $staff = $this->staffRepository->with(['user.roles'])->find($id);

        return new StaffResource($staff);
    }

    /**
     * @return StaffResource|JsonResponse
     */
    public function update(UpdateStaffRequest $request, StaffProfile $staff)
    {
        if (Auth::id() == $staff->user_id) {
            return $this->sendError('You cannot update your own staff profile here.');
        }

        $input = $request->all();
        $staff = $this->staffRepository->updateStaff($input, $staff->id);

        return new StaffResource($staff);
    }

    public function destroy(StaffProfile $staff): JsonResponse
    {
        if (Auth::id() == $staff->user_id) {
            return $this->sendError('You cannot delete your own staff profile.');
        }

        $this->staffRepository->deleteStaff($staff->id);

        return $this->sendSuccess('Staff deleted successfully');
    }
}

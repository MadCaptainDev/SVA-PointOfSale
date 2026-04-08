<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Http\Resources\CustomerWithdrawalCollection;
use App\Http\Resources\CustomerWithdrawalResource;
use App\Repositories\CustomerWithdrawalRepository;
use Illuminate\Http\Request;

/**
 * Class CustomerWithdrawalAPIController
 */
class CustomerWithdrawalAPIController extends AppBaseController
{
    /** @var CustomerWithdrawalRepository */
    private $customerWithdrawalRepository;

    public function __construct(CustomerWithdrawalRepository $customerWithdrawalRepository)
    {
        $this->customerWithdrawalRepository = $customerWithdrawalRepository;
    }

    public function index(Request $request): CustomerWithdrawalCollection
    {
        $perPage = getPageSize($request);
        $withdrawals = $this->customerWithdrawalRepository->paginate($perPage);
        CustomerWithdrawalResource::usingWithCollection();

        return new CustomerWithdrawalCollection($withdrawals);
    }

    public function show($id): CustomerWithdrawalResource
    {
        $withdrawal = $this->customerWithdrawalRepository->find($id);

        return new CustomerWithdrawalResource($withdrawal);
    }
}

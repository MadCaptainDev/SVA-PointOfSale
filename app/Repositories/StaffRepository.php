<?php

namespace App\Repositories;

use App\Models\StaffProfile;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Class StaffRepository
 */
class StaffRepository extends BaseRepository
{
    /**
     * @var array
     */
    protected $fieldSearchable = [
        'employee_code',
        'job_title',
        'department',
        'joined_at',
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
        return StaffProfile::class;
    }

    public function storeStaff(array $input): StaffProfile
    {
        try {
            DB::beginTransaction();

            $userData = [
                'first_name' => $input['first_name'],
                'last_name' => $input['last_name'],
                'email' => $input['email'],
                'phone' => $input['phone'],
                'password' => Hash::make($input['password']),
            ];

            /** @var User $user */
            $user = User::create($userData);

            if (isset($input['role_id'])) {
                $user->assignRole($input['role_id']);
            }

            if (isset($input['image']) && ! empty($input['image'])) {
                $user->addMedia($input['image'])->toMediaCollection(User::PATH, config('app.media_disc'));
            }

            $profile = $this->create([
                'user_id' => $user->id,
                'employee_code' => $input['employee_code'] ?? null,
                'job_title' => $input['job_title'] ?? null,
                'department' => $input['department'] ?? null,
                'joined_at' => $input['joined_at'] ?? null,
                'base_salary' => $input['base_salary'] ?? null,
                'commission_rate' => $input['commission_rate'] ?? null,
                'notes' => $input['notes'] ?? null,
            ]);

            DB::commit();

            return $profile->load('user.roles');
        } catch (Exception $e) {
            DB::rollBack();
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }

    public function updateStaff(array $input, int $id): StaffProfile
    {
        try {
            DB::beginTransaction();

            /** @var StaffProfile $profile */
            $profile = $this->find($id);
            /** @var User $user */
            $user = $profile->user;

            $userUpdate = [
                'first_name' => $input['first_name'],
                'last_name' => $input['last_name'],
                'email' => $input['email'],
                'phone' => $input['phone'],
            ];

            if (! empty($input['password'])) {
                $userUpdate['password'] = Hash::make($input['password']);
            }

            $user->update($userUpdate);

            if (isset($input['role_id'])) {
                $user->syncRoles($input['role_id']);
            }

            if (isset($input['image']) && $input['image']) {
                $user->clearMediaCollection(User::PATH);
                $user->addMedia($input['image'])->toMediaCollection(User::PATH, config('app.media_disc'));
            }

            $profile->update([
                'employee_code' => $input['employee_code'] ?? null,
                'job_title' => $input['job_title'] ?? null,
                'department' => $input['department'] ?? null,
                'joined_at' => $input['joined_at'] ?? null,
                'base_salary' => $input['base_salary'] ?? null,
                'commission_rate' => array_key_exists('commission_rate', $input) ? $input['commission_rate'] : $profile->commission_rate,
                'notes' => $input['notes'] ?? null,
            ]);

            DB::commit();

            return $profile->fresh(['user.roles']);
        } catch (Exception $e) {
            DB::rollBack();
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }

    public function deleteStaff(int $id): bool
    {
        try {
            DB::beginTransaction();
            $this->delete($id);
            DB::commit();

            return true;
        } catch (Exception $e) {
            DB::rollBack();
            throw new UnprocessableEntityHttpException($e->getMessage());
        }
    }
}

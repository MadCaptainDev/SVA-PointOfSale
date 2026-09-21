<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class AddStaffAndIncentivePermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            [
                'name' => 'manage_staff',
                'display_name' => 'Manage Staff',
            ],
            [
                'name' => 'manage_staff_incentives',
                'display_name' => 'Manage Staff Incentives',
            ],
        ];

        foreach ($permissions as $permission) {
            $permissionExist = Permission::whereName($permission['name'])->exists();
            if (! $permissionExist) {
                Permission::create($permission);
            }
        }

        /** @var Role $adminRole */
        $adminRole = Role::whereName(Role::ADMIN)->first();

        if (empty($adminRole)) {
            $adminRole = Role::create([
                'name' => 'admin',
                'display_name' => ' Admin',
            ]);
        }

        $allPermissions = Permission::pluck('name', 'id');
        $adminRole->syncPermissions($allPermissions);

        if (! Setting::where('key', 'staff_commission_rate')->exists()) {
            Setting::create([
                'key' => 'staff_commission_rate',
                'value' => '1',
            ]);
        }
    }
}

<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Role;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\StaffIncentiveEarning;
use App\Models\StaffIncentivePayout;
use App\Models\StaffProfile;
use App\Models\User;
use App\Models\Warehouse;
use App\Repositories\StaffIncentiveEarningRepository;
use App\Repositories\StaffIncentivePayoutRepository;
use App\Repositories\StaffRepository;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Feature coverage for Staff Management + Sales Commission Incentives.
 */
class StaffIncentivesTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected User $cashier;

    protected Role $adminRole;

    protected Role $cashierRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure permissions exist (idempotent)
        foreach (['manage_staff', 'manage_staff_incentives', 'manage_setting', 'manage_sale'] as $name) {
            Permission::findOrCreate($name, 'web');
        }

        if (! Setting::where('key', 'staff_commission_rate')->exists()) {
            Setting::create(['key' => 'staff_commission_rate', 'value' => '1']);
        } else {
            Setting::where('key', 'staff_commission_rate')->update(['value' => '1']);
        }
        \clearSettingValueCache();

        $this->adminRole = Role::firstOrCreate(
            ['name' => 'admin', 'guard_name' => 'web'],
            ['display_name' => 'Admin']
        );
        $this->adminRole->givePermissionTo(Permission::all());

        $this->cashierRole = Role::firstOrCreate(
            ['name' => 'cashier_test', 'guard_name' => 'web'],
            ['display_name' => 'Cashier Test']
        );

        $this->admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'Tester',
            'email' => 'admin_staff_test_'.uniqid().'@example.com',
            'phone' => '9'.random_int(100000000, 999999999),
            'password' => Hash::make('password'),
        ]);
        $this->admin->assignRole($this->adminRole);

        $this->cashier = User::create([
            'first_name' => 'Cashier',
            'last_name' => 'One',
            'email' => 'cashier_staff_test_'.uniqid().'@example.com',
            'phone' => '8'.random_int(100000000, 999999999),
            'password' => Hash::make('password'),
        ]);
        $this->cashier->assignRole($this->cashierRole);
    }

    public function test_migrations_created_staff_tables(): void
    {
        $this->assertTrue(\Schema::hasTable('staff_profiles'));
        $this->assertTrue(\Schema::hasTable('staff_incentive_earnings'));
        $this->assertTrue(\Schema::hasTable('staff_incentive_payouts'));
        $this->assertTrue(
            Setting::where('key', 'staff_commission_rate')->exists()
        );
        $this->assertTrue(Permission::where('name', 'manage_staff')->exists());
        $this->assertTrue(Permission::where('name', 'manage_staff_incentives')->exists());
    }

    public function test_staff_crud_api_create_list_edit(): void
    {
        Sanctum::actingAs($this->admin);

        $create = $this->postJson('/api/staff', [
            'first_name' => 'Staff',
            'last_name' => 'Member',
            'email' => 'staff_member_'.uniqid().'@example.com',
            'phone' => '7'.random_int(100000000, 999999999),
            'password' => 'secret12',
            'confirm_password' => 'secret12',
            'role_id' => $this->cashierRole->id,
            'employee_code' => 'EMP-'.uniqid(),
            'job_title' => 'Sales Associate',
            'department' => 'Retail',
            'commission_rate' => 2.5,
        ]);

        $create->assertStatus(201)->assertJsonPath('data.type', 'staff_profiles');
        $staffId = $create->json('data.id');
        $this->assertNotEmpty($staffId);

        $list = $this->getJson('/api/staff');
        $list->assertOk();
        $ids = collect($list->json('data'))->pluck('id')->all();
        $this->assertContains((int) $staffId, array_map('intval', $ids));

        $edit = $this->postJson('/api/staff/'.$staffId, [
            'first_name' => 'Staff',
            'last_name' => 'Updated',
            'email' => $create->json('data.attributes.email'),
            'phone' => $create->json('data.attributes.phone'),
            'role_id' => $this->cashierRole->id,
            'employee_code' => $create->json('data.attributes.employee_code'),
            'job_title' => 'Senior Sales',
            'department' => 'Retail',
            'commission_rate' => 3,
        ]);
        $edit->assertOk();
        $this->assertEquals('Updated', $edit->json('data.attributes.last_name'));
        $this->assertEquals('Senior Sales', $edit->json('data.attributes.job_title'));
        $this->assertEquals(3, (float) $edit->json('data.attributes.commission_rate'));
    }

    public function test_settings_staff_commission_rate_persists(): void
    {
        Sanctum::actingAs($this->admin);

        Setting::where('key', 'staff_commission_rate')->update(['value' => '1.5']);
        \clearSettingValueCache();
        $this->assertEquals('1.5', getSettingValue('staff_commission_rate'));

        Setting::where('key', 'staff_commission_rate')->update(['value' => '1']);
        \clearSettingValueCache();
        $this->assertEquals('1', getSettingValue('staff_commission_rate'));
    }

    public function test_sale_earning_uses_global_rate_when_no_override(): void
    {
        Setting::where('key', 'staff_commission_rate')->update(['value' => '1']);

        StaffProfile::create([
            'user_id' => $this->cashier->id,
            'employee_code' => 'G-'.uniqid(),
            'commission_rate' => null,
        ]);

        $sale = $this->makeSaleForUser($this->cashier->id, 1000.00);

        /** @var StaffIncentiveEarningRepository $repo */
        $repo = app(StaffIncentiveEarningRepository::class);
        $earning = $repo->createForSale($sale);

        $this->assertNotNull($earning);
        $this->assertEquals(StaffIncentiveEarning::STATUS_PENDING, $earning->status);
        $this->assertEquals(1.0, (float) $earning->commission_rate);
        $this->assertEquals(10.0, (float) $earning->amount);
    }

    public function test_sale_earning_uses_per_staff_override_rate(): void
    {
        Setting::where('key', 'staff_commission_rate')->update(['value' => '1']);

        StaffProfile::create([
            'user_id' => $this->cashier->id,
            'employee_code' => 'O-'.uniqid(),
            'commission_rate' => 2.5,
        ]);

        $sale = $this->makeSaleForUser($this->cashier->id, 1000.00);

        $earning = app(StaffIncentiveEarningRepository::class)->createForSale($sale);

        $this->assertNotNull($earning);
        $this->assertEquals(2.5, (float) $earning->commission_rate);
        $this->assertEquals(25.0, (float) $earning->amount);
    }

    public function test_payout_fifo_marks_pending_earnings_paid(): void
    {
        Sanctum::actingAs($this->admin);

        StaffProfile::create([
            'user_id' => $this->cashier->id,
            'employee_code' => 'P-'.uniqid(),
            'commission_rate' => 1,
        ]);

        $sale1 = $this->makeSaleForUser($this->cashier->id, 1000.00);
        $sale2 = $this->makeSaleForUser($this->cashier->id, 500.00);
        $repo = app(StaffIncentiveEarningRepository::class);
        $e1 = $repo->createForSale($sale1);
        $e2 = $repo->createForSale($sale2);

        $this->assertEquals(10.0, (float) $e1->amount);
        $this->assertEquals(5.0, (float) $e2->amount);

        $payoutRepo = app(StaffIncentivePayoutRepository::class);
        $payout = $payoutRepo->createPayout([
            'user_id' => $this->cashier->id,
            'amount' => 10,
            'note' => 'Partial FIFO payout',
        ]);

        $this->assertInstanceOf(StaffIncentivePayout::class, $payout);
        $this->assertEquals(10.0, (float) $payout->amount);

        $e1->refresh();
        $e2->refresh();
        $this->assertEquals(StaffIncentiveEarning::STATUS_PAID, $e1->status);
        $this->assertEquals(StaffIncentiveEarning::STATUS_PENDING, $e2->status);

        // API create payout for remaining
        $response = $this->postJson('/api/staff-incentive-payouts', [
            'user_id' => $this->cashier->id,
            'amount' => 5,
            'note' => 'Rest',
        ]);
        $response->assertStatus(201);
        $e2->refresh();
        $this->assertEquals(StaffIncentiveEarning::STATUS_PAID, $e2->status);
    }

    public function test_sale_delete_cancels_pending_earning(): void
    {
        StaffProfile::create([
            'user_id' => $this->cashier->id,
            'employee_code' => 'C-'.uniqid(),
        ]);

        $sale = $this->makeSaleForUser($this->cashier->id, 200.00);
        $earning = app(StaffIncentiveEarningRepository::class)->createForSale($sale);
        $this->assertEquals(StaffIncentiveEarning::STATUS_PENDING, $earning->status);

        app(StaffIncentiveEarningRepository::class)->cancelForSale($sale->id);
        $earning->refresh();
        $this->assertEquals(StaffIncentiveEarning::STATUS_CANCELLED, $earning->status);
    }

    public function test_permission_gates_block_unauthorized_users(): void
    {
        Sanctum::actingAs($this->cashier); // no manage_staff / manage_staff_incentives

        $this->getJson('/api/staff')->assertForbidden();
        $this->postJson('/api/staff', [
            'first_name' => 'X',
            'last_name' => 'Y',
            'email' => 'x'.uniqid().'@ex.com',
            'phone' => '6'.random_int(100000000, 999999999),
            'password' => 'secret12',
            'confirm_password' => 'secret12',
            'role_id' => $this->cashierRole->id,
        ])->assertForbidden();

        $this->getJson('/api/staff-incentive-earnings')->assertForbidden();
        $this->getJson('/api/staff-incentive-payouts')->assertForbidden();
        $this->postJson('/api/staff-incentive-payouts', [
            'user_id' => $this->cashier->id,
            'amount' => 1,
        ])->assertForbidden();
    }

    public function test_permission_gates_allow_authorized_users(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/staff')->assertOk();
        $this->getJson('/api/staff-incentive-earnings')->assertOk();
        $this->getJson('/api/staff-incentive-payouts')->assertOk();
    }

    public function test_staff_repository_store_and_update(): void
    {
        /** @var StaffRepository $repo */
        $repo = app(StaffRepository::class);

        $profile = $repo->storeStaff([
            'first_name' => 'Repo',
            'last_name' => 'Staff',
            'email' => 'repo_staff_'.uniqid().'@example.com',
            'phone' => '5'.random_int(100000000, 999999999),
            'password' => 'secret12',
            'role_id' => $this->cashierRole->id,
            'employee_code' => 'R-'.uniqid(),
            'commission_rate' => 4,
        ]);

        $this->assertInstanceOf(StaffProfile::class, $profile);
        $this->assertNotNull($profile->user_id);
        $this->assertEquals(4.0, (float) $profile->commission_rate);

        $updated = $repo->updateStaff([
            'first_name' => 'Repo',
            'last_name' => 'Updated',
            'email' => $profile->user->email,
            'phone' => $profile->user->phone,
            'role_id' => $this->cashierRole->id,
            'employee_code' => $profile->employee_code,
            'commission_rate' => 5,
        ], $profile->id);

        $this->assertEquals('Updated', $updated->user->last_name);
        $this->assertEquals(5.0, (float) $updated->commission_rate);
    }

    protected function makeSaleForUser(int $userId, float $grandTotal): Sale
    {
        $customer = Customer::create([
            'name' => 'Cust '.uniqid(),
            'email' => 'cust_'.uniqid().'@example.com',
            'phone' => '4'.random_int(100000000, 999999999),
            'country' => 'IN',
            'city' => 'City',
            'address' => 'Addr',
        ]);

        $warehouse = Warehouse::create([
            'name' => 'WH '.uniqid(),
            'phone' => '3'.random_int(100000000, 999999999),
            'country' => 'IN',
            'city' => 'City',
            'email' => 'wh_'.uniqid().'@example.com',
        ]);

        return Sale::create([
            'date' => now()->toDateString(),
            'customer_id' => $customer->id,
            'warehouse_id' => $warehouse->id,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'discount' => 0,
            'shipping' => 0,
            'grand_total' => $grandTotal,
            'received_amount' => $grandTotal,
            'paid_amount' => $grandTotal,
            'payment_type' => 1,
            'status' => 1,
            'payment_status' => 1,
            'reference_code' => 'REF-'.uniqid(),
            'user_id' => $userId,
        ]);
    }
}

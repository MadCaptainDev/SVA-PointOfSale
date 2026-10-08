<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Customer;
use App\Models\ManageStock;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Role;
use App\Models\Sale;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

/**
 * Non-GST sales: billed without tax, numbered NG_xxxx, kept out of GST lists and dashboard totals.
 */
class NonGstSalesTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected Customer $customer;

    protected Warehouse $warehouse;

    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['manage_sale', 'manage_dashboard'] as $name) {
            Permission::findOrCreate($name, 'web');
        }
        $role = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web'], ['display_name' => 'Admin']);
        $role->givePermissionTo(Permission::all());

        $this->admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'NonGst',
            'email' => 'admin_nongst_'.uniqid().'@example.com',
            'phone' => '9'.random_int(100000000, 999999999),
            'password' => Hash::make('password'),
        ]);
        $this->admin->assignRole($role);

        $this->customer = Customer::create([
            'name' => 'Cust '.uniqid(),
            'email' => 'cust_'.uniqid().'@example.com',
            'phone' => '4'.random_int(100000000, 999999999),
            'country' => 'IN',
            'city' => 'City',
            'address' => 'Addr',
        ]);

        $this->warehouse = Warehouse::create([
            'name' => 'WH '.uniqid(),
            'phone' => '3'.random_int(100000000, 999999999),
            'country' => 'IN',
            'city' => 'City',
            'email' => 'wh_'.uniqid().'@example.com',
        ]);

        $this->product = Product::create([
            'name' => 'Rice 1kg',
            'code' => 'NG-'.uniqid(),
            'product_code' => 'NG-'.uniqid(),
            'product_category_id' => ProductCategory::create(['name' => 'Cat '.uniqid()])->id,
            'brand_id' => Brand::create(['name' => 'Brand '.uniqid()])->id,
            'product_cost' => 50,
            'product_price' => 100,
            'product_unit' => '1',
            'order_tax' => 18,
            'tax_type' => '1',
        ]);

        ManageStock::create([
            'warehouse_id' => $this->warehouse->id,
            'product_id' => $this->product->id,
            'quantity' => 100,
        ]);

        Sanctum::actingAs($this->admin);
    }

    protected function billPayload(?bool $isGst, int $taxType = Sale::EXCLUSIVE): array
    {
        $payload = [
            'date' => now()->toDateString(),
            'customer_id' => $this->customer->id,
            'warehouse_id' => $this->warehouse->id,
            'tax_rate' => 5,
            'discount' => 0,
            'shipping' => 0,
            'grand_total' => 0,
            'payment_type' => 1,
            'status' => Sale::COMPLETED,
            'payment_status' => Sale::PAID,
            'sale_items' => [[
                'product_id' => $this->product->id,
                'product_price' => 100,
                'net_unit_price' => 100,
                'tax_type' => $taxType,
                'tax_value' => 18,
                'tax_amount' => 0,
                'discount_type' => Sale::FIXED,
                'discount_value' => 0,
                'discount_amount' => 0,
                'sale_unit' => 1,
                'quantity' => 2,
                'sub_total' => 0,
            ]],
        ];
        if ($isGst !== null) {
            $payload['is_gst'] = $isGst;
        }

        return $payload;
    }

    public function test_non_gst_bill_has_no_tax_and_its_own_number_series(): void
    {
        $first = $this->postJson('/api/sales', $this->billPayload(false))->assertCreated();
        $second = $this->postJson('/api/sales', $this->billPayload(false))->assertCreated();

        $sale = Sale::findOrFail($first->json('data.id'));
        $this->assertFalse($sale->is_gst);
        $this->assertEquals(0, $sale->tax_rate);
        $this->assertEquals(0, $sale->tax_amount);
        $this->assertEquals(200, $sale->grand_total);
        $this->assertEquals(0, $sale->saleItems()->sum('tax_amount'));
        $this->assertMatchesRegularExpression('/^NG_\d{4}$/', $sale->reference_code);

        $next = Sale::findOrFail($second->json('data.id'))->reference_code;
        $this->assertEquals(
            (int) substr($sale->reference_code, 3) + 1,
            (int) substr($next, 3)
        );

        // Stock still goes down for Non-GST bills.
        $this->assertEquals(96, ManageStock::whereProductId($this->product->id)->value('quantity'));
    }

    public function test_inclusive_price_stays_the_same_on_non_gst_bill(): void
    {
        $response = $this->postJson('/api/sales', $this->billPayload(false, Sale::INCLUSIVE))->assertCreated();

        $this->assertEquals(200, Sale::findOrFail($response->json('data.id'))->grand_total);
    }

    public function test_gst_bill_is_unchanged(): void
    {
        $response = $this->postJson('/api/sales', $this->billPayload(null))->assertCreated();

        $sale = Sale::findOrFail($response->json('data.id'));
        $this->assertTrue($sale->is_gst);
        // 2 x 100 + 18% item GST = 236, + 5% order tax = 247.8
        $this->assertEquals(247.8, round($sale->grand_total, 2));
        $this->assertStringStartsNotWith('NG_', $sale->reference_code);
    }

    public function test_sales_list_and_non_gst_list_are_separate(): void
    {
        $gstId = $this->postJson('/api/sales', $this->billPayload(true))->json('data.id');
        $nonGstId = $this->postJson('/api/sales', $this->billPayload(false))->json('data.id');

        $gstList = collect($this->getJson('/api/sales?page[size]=500')->assertOk()->json('data'))->pluck('id');
        $nonGstList = collect($this->getJson('/api/sales?non_gst=1&page[size]=500')->assertOk()->json('data'))->pluck('id');

        $this->assertTrue($gstList->contains($gstId));
        $this->assertFalse($gstList->contains($nonGstId));
        $this->assertTrue($nonGstList->contains($nonGstId));
        $this->assertFalse($nonGstList->contains($gstId));
    }

    public function test_dashboard_keeps_non_gst_totals_separate(): void
    {
        $gstBefore = $this->getJson('/api/all-sales-purchases-count')->assertOk()->json('data.all_sales_count');
        $nonGstBefore = $this->getJson('/api/non-gst-sales-count')->assertOk()->json('data');

        $this->postJson('/api/sales', $this->billPayload(false))->assertCreated();

        $gstAfter = $this->getJson('/api/all-sales-purchases-count')->json('data.all_sales_count');
        $nonGstAfter = $this->getJson('/api/non-gst-sales-count')->json('data');

        $this->assertEquals($gstBefore, $gstAfter);
        $this->assertEquals($nonGstBefore['all_sales'] + 200, $nonGstAfter['all_sales']);
        $this->assertEquals($nonGstBefore['today_sales'] + 200, $nonGstAfter['today_sales']);
        $this->assertEquals($nonGstBefore['all_received'] + 200, $nonGstAfter['all_received']);
    }

    public function test_editing_a_non_gst_sale_keeps_it_tax_free(): void
    {
        $id = $this->postJson('/api/sales', $this->billPayload(false))->json('data.id');
        $sale = Sale::with('saleItems')->findOrFail($id);
        $item = $sale->saleItems->first();

        $payload = $this->billPayload(true);
        $payload['tax_rate'] = 10;
        $payload['sale_items'][0]['sale_item_id'] = $item->id;
        $payload['sale_items'][0]['quantity'] = 3;

        $this->putJson('/api/sales/'.$id, $payload)->assertOk();

        $sale->refresh();
        $this->assertFalse($sale->is_gst);
        $this->assertEquals(0, $sale->tax_amount);
        $this->assertEquals(300, $sale->grand_total);
    }
}

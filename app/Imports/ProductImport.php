<?php

namespace App\Imports;

use App\Models\BaseUnit;
use App\Models\Brand;
use App\Models\MainProduct;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Picqer\Barcode\BarcodeGeneratorPNG;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ProductImport implements ToCollection, WithChunkReading, WithStartRow
{
    public array  $results  = [];
    public int    $imported = 0;
    public int    $failed   = 0;
    public int    $skipped  = 0;

    private bool  $dryRun;

    public function __construct(bool $dryRun = false)
    {
        $this->dryRun = $dryRun;
    }

    public function collection(Collection $rows): void
    {
        ini_set('max_execution_time', 36000000);

        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // Excel row number (1 = header)
            $name   = trim((string)($row[0] ?? ''));
            $code   = trim((string)($row[1] ?? ''));

            if ($name === '') continue;

            // ── Duplicate checks ────────────────────────────────────────────
            if (Product::whereName($name)->exists()) {
                $this->skipped++;
                $this->results[] = [
                    'row'    => $rowNum,
                    'name'   => $name,
                    'code'   => $code,
                    'status' => 'skipped',
                    'error'  => 'Product name already exists.',
                ];
                continue;
            }

            if (Product::where('code', $code)->exists()) {
                $this->skipped++;
                $this->results[] = [
                    'row'    => $rowNum,
                    'name'   => $name,
                    'code'   => $code,
                    'status' => 'skipped',
                    'error'  => 'Product code already exists.',
                ];
                continue;
            }

            // ── Dry run: validate only, no DB writes ─────────────────────────
            if ($this->dryRun) {
                $this->imported++;
                $this->results[] = [
                    'row'    => $rowNum,
                    'name'   => $name,
                    'code'   => $code,
                    'status' => 'preview',
                    'error'  => null,
                ];
                continue;
            }

            // ── Actual import ────────────────────────────────────────────────
            try {
                DB::beginTransaction();

                $productCategory = ProductCategory::firstOrCreate(['name' => $row[2]]);
                $brand           = Brand::firstOrCreate(['name' => $row[3]]);
                $baseUnit        = BaseUnit::whereName(strtolower($row[7]))->first();

                if (!$baseUnit) {
                    throw new UnprocessableEntityHttpException('Base unit "' . $row[7] . '" not found.');
                }

                $productUnitId = $baseUnit->id;
                $saleUnit      = Unit::whereName(strtolower($row[8]))->whereBaseUnit($productUnitId)->first();
                $purchaseUnit  = Unit::whereName(strtolower($row[9]))->whereBaseUnit($productUnitId)->first();

                if (!$saleUnit || !$purchaseUnit) {
                    throw new UnprocessableEntityHttpException('Sale or Purchase unit not found for "' . $row[8] . '" / "' . $row[9] . '".');
                }

                $barcodeSymbol = Product::CODE128;

                $taxType = match (strtolower(trim((string)$row[12]))) {
                    'exclusive' => 1,
                    'inclusive' => 2,
                    default     => throw new UnprocessableEntityHttpException('Invalid tax type: ' . $row[12]),
                };

                $mainProduct = MainProduct::create([
                    'name'         => $name,
                    'code'         => $code,
                    'product_unit' => $productUnitId,
                    'product_type' => MainProduct::SINGLE_PRODUCT,
                ]);

                $product = Product::create([
                    'name'                => $name,
                    'code'                => $code,
                    'product_code'        => $code,
                    'product_category_id' => $productCategory->id,
                    'brand_id'            => $brand->id,
                    'barcode_symbol'      => $barcodeSymbol,
                    'product_cost'        => $row[5],
                    'product_price'       => $row[6],
                    'product_unit'        => $productUnitId,
                    'sale_unit'           => $saleUnit->id,
                    'purchase_unit'       => $purchaseUnit->id,
                    'stock_alert'         => $row[10] ?? null,
                    'order_tax'           => $row[11] ?? null,
                    'tax_type'            => $taxType,
                    'notes'               => $row[13] ?? null,
                    'hsn_code'            => isset($row[14]) && $row[14] !== '' ? (string)$row[14] : null,
                    'main_product_id'     => $mainProduct->id,
                ]);

                // Barcode image
                $reference_code = 'PR_' . $product->id;
                $generator = new BarcodeGeneratorPNG();
                Storage::disk(config('app.media_disc'))->put(
                    'product_barcode/barcode-' . $reference_code . '.png',
                    $generator->getBarcode($code, $this->getBarcodeType($barcodeSymbol), 4, 70)
                );

                // Stock / purchase
                if (!empty($row[15]) && !empty($row[16]) && !empty($row[17])) {
                    $warehouse = Warehouse::whereRaw('LOWER(name) = ?', [strtolower($row[15])])->first();
                    $supplier  = Supplier::whereRaw('LOWER(name) = ?',  [strtolower($row[16])])->first();

                    if ($warehouse && $supplier) {
                        manageStock($warehouse->id, $product->id, $row[17]);

                        $status = match (strtolower($row[18] ?? 'pending')) {
                            'received' => 1,
                            'ordered'  => 3,
                            default    => 2,
                        };

                        $purchase = Purchase::create([
                            'supplier_id'  => $supplier->id,
                            'warehouse_id' => $warehouse->id,
                            'date'         => Carbon::now()->format('Y-m-d'),
                            'status'       => $status,
                        ]);

                        PurchaseItem::create([
                            'purchase_id'     => $purchase->id,
                            'product_id'      => $product->id,
                            'product_cost'    => $product->product_cost,
                            'net_unit_cost'   => $product->product_cost,
                            'tax_type'        => $product->tax_type,
                            'tax_value'       => $product->order_tax,
                            'tax_amount'      => 0,
                            'discount_type'   => Purchase::FIXED,
                            'discount_value'  => 0,
                            'discount_amount' => 0,
                            'purchase_unit'   => $product->purchase_unit,
                            'quantity'        => $row[17],
                            'sub_total'       => $product->product_cost * $row[17],
                        ]);

                        $purchase->update([
                            'reference_code' => getSettingValue('purchase_code') . '_111' . $purchase->id,
                            'grand_total'    => $product->product_cost * $row[17],
                        ]);
                    }
                }

                DB::commit();
                $this->imported++;
                $this->results[] = [
                    'row'    => $rowNum,
                    'name'   => $name,
                    'code'   => $code,
                    'status' => 'success',
                    'error'  => null,
                ];
                Log::info("Import success: row $rowNum, product ID " . $product->id);

            } catch (Exception $e) {
                DB::rollBack();
                $this->failed++;
                $this->results[] = [
                    'row'    => $rowNum,
                    'name'   => $name,
                    'code'   => $code,
                    'status' => 'failed',
                    'error'  => $e->getMessage(),
                ];
                Log::error("Import failed row $rowNum: " . $e->getMessage());
            }
        }
    }

    public function chunkSize(): int { return 100; }
    public function startRow(): int  { return 2; }

    private function getBarcodeType(int $barcodeSymbol): string
    {
        return match ($barcodeSymbol) {
            Product::CODE128 => BarcodeGeneratorPNG::TYPE_CODE_128,
            Product::CODE39  => BarcodeGeneratorPNG::TYPE_CODE_39,
            Product::EAN8    => BarcodeGeneratorPNG::TYPE_EAN_8,
            Product::EAN13   => BarcodeGeneratorPNG::TYPE_EAN_13,
            Product::UPC     => BarcodeGeneratorPNG::TYPE_UPC_A,
            default          => throw new UnprocessableEntityHttpException('Invalid barcode type.'),
        };
    }
}

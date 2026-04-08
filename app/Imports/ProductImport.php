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
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Picqer\Barcode\BarcodeGeneratorPNG;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ProductImport implements ToCollection, WithChunkReading, WithStartRow, WithValidation
{
    public function collection(Collection $rows): JsonResponse
    {

        $collection = $rows->toArray();
        ini_set('max_execution_time', 36000000);

        foreach ($collection as $key => $row) {
            try {
                Log::info("Processing row: " . json_encode($row));
                DB::beginTransaction();

                if (Product::whereName($row[0])->exists()) {
                    throw new UnprocessableEntityHttpException('Product Name ' . $row[0] . ' already exists.');
                }

                if (Product::where('code', $row[1])->exists()) {
                    throw new UnprocessableEntityHttpException('Product Code ' . $row[1] . ' already exists.');
                }

                $productCategory = ProductCategory::firstOrCreate(['name' => $row[2]]);
                $brand = Brand::firstOrCreate(['name' => $row[3]]);
                $baseUnit = BaseUnit::whereName(strtolower($row[7]))->first();

                if (!$baseUnit) {
                    throw new UnprocessableEntityHttpException('Product unit ' . $row[7] . ' not found.');
                }

                $productUnitId = $baseUnit->id;
                $saleUnit = Unit::whereName(strtolower($row[8]))->whereBaseUnit($productUnitId)->first();
                $purchaseUnit = Unit::whereName(strtolower($row[9]))->whereBaseUnit($productUnitId)->first();

                if (!$saleUnit || !$purchaseUnit) {
                    throw new UnprocessableEntityHttpException('Sale or Purchase unit not found.');
                }

               /* $barcodeSymbol = match($row[4]) {
                    'CODE128' => Product::CODE128,
                    'CODE39' => Product::CODE39,
                    default => throw new UnprocessableEntityHttpException('Invalid barcode symbol: ' . $row[4]),
                };*/
                
               $barcodeSymbol = Product::CODE128;


                $taxType = match(strtolower($row[12])) {
                    'exclusive' => 1,
                    'inclusive' => 2,
                    default => throw new UnprocessableEntityHttpException('Invalid tax type: ' . $row[12]),
                };

                $mainProduct = MainProduct::create([
                    'name' => $row[0],
                    'code' => (string)$row[1],
                    'product_unit' => $productUnitId,
                    'product_type' => MainProduct::SINGLE_PRODUCT,
                ]);
                
            

                $product = Product::create([
                    'name' => $row[0],
                    'code' => (string)$row[1],
                    'product_code' => (string)$row[1],
                    'product_category_id' => $productCategory->id,
                    'brand_id' => $brand->id,
                    'barcode_symbol' => $barcodeSymbol,
                   'product_cost'  => $row[5],
'product_price' => $row[6],
                    'product_unit' => $productUnitId,
                    'sale_unit' => $saleUnit->id,
                    'purchase_unit' => $purchaseUnit->id,
                    'stock_alert' => $row[10] ?? null,
                    'order_tax' => $row[11] ?? null,
                    'tax_type' => $taxType,
                    'notes' => $row[13] ?? null,
                    'main_product_id' => $mainProduct->id,
                    
                    
                    
                ]);
                    

                $reference_code = 'PR_' . $product->id;
                $generator = new BarcodeGeneratorPNG();
                Storage::disk(config('app.media_disc'))->put(
                    'product_barcode/barcode-' . $reference_code . '.png',
                    $generator->getBarcode($row[1], $this->getBarcodeType($barcodeSymbol), 4, 70)
                );

                if (!empty($row[14]) && !empty($row[15]) && !empty($row[16])) {
                    $warehouse = Warehouse::whereRaw('LOWER(name) = ?', [strtolower($row[14])])->first();
                    $supplier = Supplier::whereRaw('LOWER(name) = ?', [strtolower($row[15])])->first();

                    if ($warehouse && $supplier) {
                        manageStock($warehouse->id, $product->id, $row[16]);
                        $status = match(strtolower($row[17])) {
                            'received' => 1,
                            'ordered' => 3,
                            default => 2,
                        };

                        $purchase = Purchase::create([
                            'supplier_id' => $supplier->id,
                            'warehouse_id' => $warehouse->id,
                            'date' => Carbon::now()->format('Y-m-d'),
                            'status' => $status,
                        ]);

                        PurchaseItem::create([
                            'purchase_id' => $purchase->id,
                            'product_id' => $product->id,
                            'product_cost' => $product->product_cost,
                            'net_unit_cost' => $product->product_cost,
                            'tax_type' => $product->tax_type,
                            'tax_value' => $product->order_tax,
                            'tax_amount' => 0,
                            'discount_type' => Purchase::FIXED,
                            'discount_value' => 0,
                            'discount_amount' => 0,
                            'purchase_unit' => $product->purchase_unit,
                            'quantity' => $row[16],
                            'sub_total' => $product->product_cost * $row[16],
                        ]);

                        $purchase->update([
                            'reference_code' => getSettingValue('purchase_code') . '_111' . $purchase->id,
                            'grand_total' => $product->product_cost * $row[16],
                        ]);
                    }
                }

                DB::commit();
                Log::info("Imported successfully: Product ID " . $product->id);

            } catch (Exception $e) {
                DB::rollBack();
                Log::error("Import failed for row: " . json_encode($row) . " | Error: " . $e->getMessage());
            }
        }

        return response()->json([
            'data' => [
                'message' => 'Products imported successfully',
            ],
        ]);
    }

    public function chunkSize(): int
    {
        return 100;
    }

    public function startRow(): int
    {
        return 2;
    }

    public function rules(): array
    {
        return [
            '0' => 'required',
            '1' => 'required',
            '2' => 'required',
            '3' => 'required',
            '4' => 'required',
            '5' => 'required|numeric',
            '6' => 'required|numeric',
            '7' => 'required',
            '8' => 'required',
            '9' => 'required',
            '10' => 'nullable|numeric',
            '11' => 'nullable|numeric',
            '12' => 'required',
        ];
    }

    public function customValidationMessages(): array
    {
        return [
            '0.required' => 'Name is required',
            '1.required' => 'Code is required',
            '2.required' => 'Category is required',
            '3.required' => 'Brand is required',
            '4.required' => 'Barcode Symbol is required',
            '5.required' => 'Product Cost is required',
            '5.numeric' => 'Product Cost must be numeric',
            '6.required' => 'Product Price is required',
            '6.numeric' => 'Product Price must be numeric',
            '7.required' => 'Product Unit is required',
            '8.required' => 'Sale Unit is required',
            '9.required' => 'Purchase Unit is required',
            '12.required' => 'Tax Type is required',
        ];
    }

    private function getBarcodeType($barcodeSymbol)
    {
        return match ($barcodeSymbol) {
            Product::CODE128 => BarcodeGeneratorPNG::TYPE_CODE_128,
            Product::CODE39 => BarcodeGeneratorPNG::TYPE_CODE_39,
            Product::EAN8 => BarcodeGeneratorPNG::TYPE_EAN_8,
            Product::EAN13 => BarcodeGeneratorPNG::TYPE_EAN_13,
            Product::UPC => BarcodeGeneratorPNG::TYPE_UPC_A,
            default => throw new UnprocessableEntityHttpException('Invalid barcode type.'),
        };
    }
}

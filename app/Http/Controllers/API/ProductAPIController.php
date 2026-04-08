<?php

namespace App\Http\Controllers\API;

use App\Exports\ProductExcelExport;
use App\Http\Controllers\AppBaseController;
use App\Http\Requests\CreateProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductCollection;
use App\Http\Resources\ProductResource;
use App\Imports\ProductImport;
use App\Models\MainProduct;
use App\Models\Product;
use App\Models\PurchaseItem;
use App\Models\SaleItem;
use App\Models\VariationProduct;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class ProductAPIController extends AppBaseController
{
    /** @var ProductRepository */
    private $productRepository;

    public function __construct(ProductRepository $productRepository)
    {
        $this->productRepository = $productRepository;
    }

    public function index(Request $request)
    {
        if ($request->get('page') && $request->get('page')['size'] == '0') {
            ini_set('memory_limit', '512M');

            if ($request->get('minimal')) {
                $warehouseId = $request->get('warehouse_id');

                $stockQuery = DB::table('manage_stocks')
                    ->select('product_id', DB::raw('SUM(quantity) as total_quantity'))
                    ->groupBy('product_id');

                if ($warehouseId && $warehouseId != 'null') {
                    $stockQuery->where('warehouse_id', $warehouseId);
                }

                $query = DB::table('products')
                    ->leftJoin('base_units as pu', 'products.product_unit', '=', 'pu.id')
                    ->leftJoin('units as su', 'products.sale_unit', '=', 'su.id')
                    ->leftJoin('base_units as subu', 'su.base_unit', '=', 'subu.id')
                    ->leftJoinSub($stockQuery, 'stock_counts', function ($join) {
                    $join->on('products.id', '=', 'stock_counts.product_id');
                })
                    ->leftJoin('variation_products', 'products.id', '=', 'variation_products.product_id')
                    ->leftJoin('variations', 'variation_products.variation_id', '=', 'variations.id')
                    ->leftJoin('variation_types', 'variation_products.variation_type_id', '=', 'variation_types.id')
                    ->select([
                    'products.id',
                    'products.name',
                    'products.code',
                    'products.product_code',
                    'products.main_product_id',
                    'products.product_price',
                    'products.product_unit',
                    'products.sale_unit',
                    'products.product_cost',
                    'products.stock_alert',
                    'products.order_tax',
                    'products.tax_type',
                    'pu.name as pu_name',
                    'su.name as su_name',
                    'subu.name as su_base_name',
                    'stock_counts.total_quantity as stock_quantity',
                    'variation_products.main_product_id as v_main_id',
                    'variation_products.product_id as v_prod_id',
                    'variation_products.variation_id as v_var_id',
                    'variation_products.variation_type_id as v_type_id',
                    'variations.name as v_name',
                    'variation_types.name as vt_name',
                ]);

                if ($request->get('product_unit')) {
                    $query->where('products.product_unit', $request->get('product_unit'));
                }

                $products = $query->get();

                $data = $products->map(function ($p) {
                    $attributes = [
                        'name' => $p->name,
                        'code' => $p->code,
                        'product_code' => $p->product_code,
                        'main_product_id' => $p->main_product_id,
                        'product_price' => $p->product_price,
                        'product_unit' => $p->product_unit,
                        'sale_unit' => $p->sale_unit,
                        'product_cost' => $p->product_cost,
                        'stock_alert' => $p->stock_alert,
                        'order_tax' => $p->order_tax,
                        'tax_type' => $p->tax_type,
                        'stock' => ['quantity' => $p->stock_quantity ?? 0],
                        'product_unit_name' => ['name' => $p->pu_name],
                        'sale_unit_name' => ['name' => $p->su_name, 'base_unit_name' => ['name' => $p->su_base_name]],
                        'in_stock' => $p->stock_quantity ?? 0,
                    ];

                    if ($p->v_prod_id) {
                        $attributes['variation_product'] = [
                            'main_product_id' => $p->v_main_id,
                            'product_id' => $p->v_prod_id,
                            'variation_id' => $p->v_var_id,
                            'variation_type_id' => $p->v_type_id,
                            'variation_name' => $p->v_name,
                            'variation_type_name' => $p->vt_name,
                        ];
                    }

                    return [
                    'type' => 'products',
                    'id' => $p->id,
                    'attributes' => $attributes,
                    'links' => ['self' => route('products.show', $p->id)],
                    ];
                });

                return response()->json(['data' => $data]);
            }
        }

        $perPage = getPageSize($request);
        $minimal = $request->get('minimal');

        $relations = [
            'productCategory', 'brand', 'variationProduct.variation', 'variationProduct.variationType',
            'productUnit', 'saleUnit.baseUnit', 'purchaseUnit.baseUnit', 'stocks'
        ];

        if (!$minimal) {
            $relations[] = 'mainProduct.media';
            $relations[] = 'media';
        }

        $products = $this->productRepository->with($relations);

        if ($request->get('product_unit')) {
            $products->where('product_unit', $request->get('product_unit'));
        }

        if ($request->get('warehouse_id') && $request->get('warehouse_id') != 'null') {
            $warehouseId = $request->get('warehouse_id');
            $products->whereHas('stock', function ($q) use ($warehouseId) {
                $q->where('manage_stocks.warehouse_id', $warehouseId);
            })->with([
                'stock' => function (HasOne $query) use ($warehouseId) {
                $query->where('manage_stocks.warehouse_id', $warehouseId);
            },
            ]);
        }

        $products = $products->paginate($perPage);
        ProductResource::usingWithCollection();

        return new ProductCollection($products);
    }

    /**
     * @return ProductResource|JsonResponse
     */
    public function store(CreateProductRequest $request)
    {
        $input = $request->all();

        if ($input['main_product_id']) {
            $mainProduct = MainProduct::find($input['main_product_id']);
            if ($mainProduct->product_type == MainProduct::SINGLE_PRODUCT) {
                return $this->sendError('You can add variations for single type product');
            }
        }

        if ($input['barcode_symbol'] == Product::EAN8 && strlen($input['code']) != 7) {
            return $this->sendError('Please enter 7 digit code');
        }

        if ($input['barcode_symbol'] == Product::UPC && strlen($input['code']) != 11) {
            return $this->sendError(' Please enter 11 digit code');
        }

        $product = $this->productRepository->storeProduct($input);

        VariationProduct::create([
            'product_id' => $product->id,
            'variation_id' => $input['variation_id'],
            'variation_type_id' => $input['variation_type'],
            'main_product_id' => $input['main_product_id'],
        ]);

        return new ProductResource($product);
    }

    public function show($id): ProductResource
    {
        $product = $this->productRepository->find($id);

        return new ProductResource($product);
    }

    public function update(UpdateProductRequest $request, $id): ProductResource
    {
        $input = $request->all();

        $product = $this->productRepository->updateProduct($input, $id);

        return new ProductResource($product);
    }

    public function destroy($id): JsonResponse
    {

        $purchaseItemModels = [
            PurchaseItem::class ,
        ];
        $saleItemModels = [
            SaleItem::class ,
        ];
        $purchaseResult = canDelete($purchaseItemModels, 'product_id', $id);
        $saleResult = canDelete($saleItemModels, 'product_id', $id);
        if ($purchaseResult || $saleResult) {
            return $this->sendError(__('messages.error.product_cant_deleted'));
        }

        if (File::exists(Storage::path('product_barcode/barcode-PR_' . $id . '.png'))) {
            File::delete(Storage::path('product_barcode/barcode-PR_' . $id . '.png'));
        }

        $product = $this->productRepository->find($id);
        $mainProduct = MainProduct::withCount('products')->find($product->main_product_id);

        if ($mainProduct->product_type == MainProduct::VARIATION_PRODUCT && $mainProduct->products_count <= 1) {
            return $this->sendError('You can not delete last variation product');
        }

        VariationProduct::where('product_id', $id)->delete();

        $this->productRepository->delete($id);

        return $this->sendSuccess('Product deleted successfully');
    }

    public function productImageDelete($mediaId): JsonResponse
    {
        $media = Media::where('id', $mediaId)->firstOrFail();
        $media->delete();

        return $this->sendSuccess('Product image deleted successfully');
    }

    public function importProducts(Request $request): JsonResponse
    {
        Excel::import(new ProductImport, request()->file('file'));

        return $this->sendSuccess('Products imported successfully');
    }

    public function getProductExportExcel(Request $request): JsonResponse
    {
        if (Storage::exists('excel/product-excel-export.xlsx')) {
            Storage::delete('excel/product-excel-export.xlsx');
        }
        Excel::store(new ProductExcelExport, 'excel/product-excel-export.xlsx');

        $data['product_excel_url'] = Storage::url('excel/product-excel-export.xlsx');

        return $this->sendResponse($data, 'Product retrieved successfully');
    }

    public function getAllProducts()
    {
        $products = Product::all();
        $data = [];

        foreach ($products as $product) {
            $data[] = [
                'id' => $product->id,
                'name' => $product->name,
            ];
        }

        return $this->sendResponse($data, 'Products retrieve successfully.');
    }
}

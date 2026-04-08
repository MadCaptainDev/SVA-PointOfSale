<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Imports\ProductImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ProductImportController extends Controller
{
    public function import(Request $request)
{
    $validator = Validator::make($request->all(), [
        'file' => 'required|file|mimes:xlsx,xls',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'status' => false,
            'message' => 'Invalid file upload',
            'errors' => $validator->errors()
        ], 422);
    }

    try {
          Log::info("Works");
        Excel::import(new ProductImport, $request->file('file'));

        return response()->json([
            'status' => true,
            'message' => 'Products imported successfully!'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => false,
            'message' => 'Import failed.',
            'error' => $e->getMessage()
        ], 500);
    }
}

}

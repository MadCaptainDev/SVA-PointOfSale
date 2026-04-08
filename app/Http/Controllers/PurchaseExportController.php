<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Exports\PurchaseUnitsExport;
use Maatwebsite\Excel\Facades\Excel;

class PurchaseExportController extends Controller
{
    public function exportUnits(Request $request)
    {
        $request->validate([
            'reference_code' => 'required|string',
        ]);

        $reference = $request->input('reference_code');

        // Add the file extension
        $filename = $reference . '.xlsx';

        return Excel::download(new PurchaseUnitsExport($reference), $filename);
    }
}

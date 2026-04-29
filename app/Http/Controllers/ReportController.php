<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Exports\NewPurchaseReportExport;
use App\Exports\GstrSummaryExport;
use App\Exports\HsnSalesReportExport;
use App\Exports\NewSalesReportExport;

use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Carbon\Carbon;

class ReportController extends Controller
{
public function downloadAllReports()
{
    $timestamp = Carbon::now()->format('Ymd_His');
    $zipFileName = "all-reports-{$timestamp}.zip";
    $zipPath = storage_path("app/public/{$zipFileName}");

    $zip = new ZipArchive;

    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {

        // Calculate last month's start and end date
        $lastMonth = Carbon::now()->subMonthNoOverflow();
        $startDate = $lastMonth->copy()->startOfMonth()->format('Y-m-d'); // 1st day of last month
        $endDate   = $lastMonth->copy()->endOfMonth()->format('Y-m-d');   // last day of last month

        // Map filenames to controller methods
        $reports = [
            'purchase-report.xlsx'         => [$this, 'purchaseReport'],
            'sales-report.xlsx'            => [$this, 'salesReport'],
            'hsn-sales-report.xlsx'        => [$this, 'hsnSalesReport'],
            'hsn-purchase-report.xlsx'     => [$this, 'hsnPurchaseReport'],
            'hsn-sales-return-report.xlsx' => [$this, 'hsnSalesReturnReport'],
            'sales-return-report.xlsx'     => [$this, 'salesReturnReport'],
            'gstr-summary-report.xlsx'     => [$this, 'gstrSummaryReport'],
        ];

        foreach ($reports as $fileName => $method) {
            try {
                // Call controller method directly with Request object
                $request = request()->merge(['start_date' => $startDate, 'end_date' => $endDate]);
                $response = call_user_func($method, $request);

                // Extract raw XLSX content
                $content = $response instanceof \Symfony\Component\HttpFoundation\BinaryFileResponse
                    ? file_get_contents($response->getFile()->getRealPath())
                    : $response->getContent();

                $zip->addFromString($fileName, $content);
            } catch (\Exception $e) {
                \Log::error("Failed to generate report {$fileName}: " . $e->getMessage());
            }
        }

        $zip->close();
    }

    return response()->download($zipPath)->deleteFileAfterSend(true);
}


public function hsnSalesReturnReport(Request $request)
{
    $startDate = $request->input('start_date', '2025-07-01');
    $endDate = $request->input('end_date', '2025-07-31');

    $rawData = DB::select("
        SELECT 
            p.hsn_code,
            p.name AS product_name,
            SUM(sri.quantity) AS total_qty,
            SUM(sri.sub_total) AS gross_total,
            COALESCE(sri.tax_value, 0) AS tax_rate
        FROM sale_return_items sri
        JOIN sales_return sr ON sri.sale_return_id = sr.id
        JOIN products p ON sri.product_id = p.id
        WHERE sr.date BETWEEN ? AND ?
        GROUP BY p.hsn_code, p.name, sri.tax_value
        ORDER BY p.hsn_code ASC, p.name ASC
    ", [$startDate, $endDate]);

    $finalData = [];
    $sNo = 1;

    foreach ($rawData as $row) {
        $taxableValue = 0.0;
        $totalTax = 0.0;
        $cgst = 0.0;
        $sgst = 0.0;

        if ($row->tax_rate > 0) {
            $taxableValue = $row->gross_total / (1 + ($row->tax_rate / 100));
            $totalTax = $row->gross_total - $taxableValue;
            $cgst = round($totalTax / 2, 2);
            $sgst = round($totalTax - $cgst, 2);
        } else {
            $taxableValue = $row->gross_total;
        }

        $finalData[] = [
            's_no'          => $sNo++,
            'hsn_code'      => $row->hsn_code,
            'product_name'  => $row->product_name,
            'total_qty'     => $row->total_qty,
            'tax_rate'      => $row->tax_rate,
            'taxable_value' => round($taxableValue, 2),
            'cgst_amount'   => $cgst,
            'sgst_amount'   => $sgst,
            'cess'          => 0.00,
            'total_tax'     => round($totalTax, 2),
            'total_amount'  => round($row->gross_total, 2)
        ];
    }

    return Excel::download(
        new \App\Exports\HsnSalesReturnReportExport(collect($finalData), $startDate, $endDate),
        'hsn_sales_return_report.xlsx'
    );
}



    public function purchaseReport(Request $request)
    {
        // Get date range from request or use defaults
        $startDate = $request->input('start_date', '2025-07-01');
        $endDate = $request->input('end_date', '2025-07-31');

        $rawData = DB::select("
            SELECT 
                s.name AS supplier_name,
                GROUP_CONCAT(DISTINCT p.reference_code ORDER BY p.reference_code SEPARATOR ', ') AS reference_codes,
                DATE_FORMAT(p.date, '%d/%m/%Y') AS purchase_date,
                items.tax_rate,
                ROUND(SUM(items.sub_total), 2) AS taxable_value
            FROM purchases p
            JOIN suppliers s ON p.supplier_id = s.id
            JOIN (
                SELECT 
                    purchase_id,
                    COALESCE(tax_value, 0) AS tax_rate,
                    sub_total
                FROM purchase_items
            ) items ON items.purchase_id = p.id
            WHERE p.date BETWEEN ? AND ?
            GROUP BY 
                s.name, 
                p.date,
                items.tax_rate
            ORDER BY 
                p.date ASC
        ", [$startDate, $endDate]);

        $finalData = [];
        $sNo = 1;

        foreach ($rawData as $row) {
            $igst = 0.0;
            $cgst = 0.0;
            $grandTotal = $row->taxable_value;

            if ($row->tax_rate > 0) {
                $igst = round(($row->tax_rate / 100) * $row->taxable_value / 2, 2);
                $cgst = round(($row->tax_rate / 100) * $row->taxable_value / 2, 2);
                $grandTotal = round($row->taxable_value + $igst + $cgst, 2);
            } else {
                Log::warning('Missing or zero tax/subtotal found in purchase report.', [
                    'supplier' => $row->supplier_name,
                    'date' => $row->purchase_date,
                    'reference_codes' => $row->reference_codes ?? '',
                    'tax_rate' => $row->tax_rate,
                    'taxable_value' => $row->taxable_value
                ]);
            }

            $finalData[] = [
                's_no' => $sNo++,
                'supplier_name' => $row->supplier_name,
                'reference_codes' => $row->reference_codes,
                'purchase_date' => $row->purchase_date,
                'tax_rate' => $row->tax_rate,
                'taxable_value' => $row->taxable_value,
                'igst_amount' => $igst,
                'cgst_amount' => $cgst,
                'grand_total' => $grandTotal,
            ];
        }

       return Excel::download(new NewPurchaseReportExport(collect($finalData), $startDate, $endDate), 'purchase_report.xlsx');

    }
    
    public function salesReport(Request $request)
{
    // Get date range from request or use defaults
    $startDate = $request->input('start_date', '2025-07-01');
    $endDate = $request->input('end_date', '2025-07-31');

    // Raw query: aggregate per invoice and tax rate
    $rawData = DB::select("
    SELECT
        c.name AS customer_name,
        s.reference_code AS invoice_no,
        DATE_FORMAT(s.date, '%d/%m/%Y') AS invoice_date,
        items.tax_rate,
        SUM(items.sub_total) AS gross_total
    FROM sales s
    JOIN customers c ON s.customer_id = c.id
    JOIN (
        SELECT 
            sale_id,
            COALESCE(tax_value, 0) AS tax_rate,
            sub_total
        FROM sale_items
    ) items ON items.sale_id = s.id
    WHERE s.date BETWEEN ? AND ?
    GROUP BY c.name, s.reference_code, DATE(s.date), items.tax_rate
    ORDER BY s.reference_code ASC, s.date ASC
", [$startDate, $endDate]);


    $finalData = [];
    $sNo = 1;

    foreach ($rawData as $row) {
        // Tax-inclusive calculation
        $taxableValue = 0.0;
        $totalTax = 0.0;
        $cgst = 0.0;
        $sgst = 0.0;

        if ($row->tax_rate > 0) {
            $taxableValue = $row->gross_total / (1 + ($row->tax_rate / 100));
            $totalTax = $row->gross_total - $taxableValue;

            // Split into CGST and SGST (round residual to SGST)
            $cgst = round($totalTax / 2, 2);
            $sgst = round($totalTax - $cgst, 2);
        } else {
            $taxableValue = $row->gross_total;
        }

        $finalData[] = [
            's_no' => $sNo++,
            'customer_name' => $row->customer_name,
            'invoice_no' => $row->invoice_no,
            'invoice_date' => $row->invoice_date,
            'tax_rate' => $row->tax_rate,
            'taxable_value' => round($taxableValue, 2),
            'cgst_amount' => $cgst,
            'sgst_amount' => $sgst,
            'cess' => 0.00,
            'total_tax' => round($totalTax, 2),
            'total_amount' => round($row->gross_total, 2)
        ];
    }

    return Excel::download(new \App\Exports\NewSalesReportExport(collect($finalData), $startDate, $endDate), 'sales_report.xlsx');
}

public function salesReturnReport(Request $request)
{
    // Get date range from request or set defaults
    $startDate = $request->input('start_date', '2025-07-01');
    $endDate = $request->input('end_date', '2025-07-31');

    $rawData = DB::select("
        SELECT
            (@rownum := @rownum + 1) AS serial_no,
            t.customer_name,
            t.invoice_no,
            t.invoice_date,
            t.tax_rate,
            ROUND(t.taxable_value, 2) AS taxable_value,
            ROUND(t.total_tax / 2, 2) AS cgst_amount,
            ROUND(t.total_tax - ROUND(t.total_tax / 2, 2), 2) AS sgst_amount,
            0.00 AS cess,
            ROUND(t.total_tax, 2) AS total_tax,
            ROUND(t.gross_total, 2) AS total_amount
        FROM (
            SELECT
                c.name AS customer_name,
                sr.reference_code AS invoice_no,
                DATE_FORMAT(sr.date, '%d/%m/%Y') AS invoice_date,
                items.tax_value AS tax_rate,
                SUM(COALESCE(items.sub_total, 0)) AS gross_total,
                SUM(
                    COALESCE(
                        items.tax_amount,
                        items.sub_total - (items.sub_total / (1 + (items.tax_value/100)))
                    )
                ) AS total_tax,
                SUM(COALESCE(items.sub_total, 0)) - SUM(
                    COALESCE(
                        items.tax_amount,
                        items.sub_total - (items.sub_total / (1 + (items.tax_value/100)))
                    )
                ) AS taxable_value
            FROM sale_return_items items
            JOIN sales_return sr ON items.sale_return_id = sr.id
            JOIN customers c ON sr.customer_id = c.id
            WHERE sr.date BETWEEN ? AND ?
            GROUP BY c.name, sr.reference_code, DATE(sr.date), items.tax_value
            ORDER BY sr.date ASC
        ) AS t
        JOIN (SELECT @rownum := 0) rn
    ", [$startDate, $endDate]);

    // Return Excel export
    return Excel::download(
        new \App\Exports\SalesReturnReportExport(collect($rawData), $startDate, $endDate),
        'sales_return_report.xlsx'
    );
}


public function hsnSalesReport(Request $request)
{
    // Get date range from request or use defaults
    $startDate = $request->input('start_date', '2025-07-01');
    $endDate = $request->input('end_date', '2025-07-31');

    // Query: aggregate per HSN code and tax rate
    $rawData = DB::select("
        SELECT 
            p.hsn_code,
            p.name AS product_name,
            SUM(si.quantity) AS total_qty,
            SUM(si.sub_total) AS gross_total,
            COALESCE(si.tax_value, 0) AS tax_rate
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.date BETWEEN ? AND ?
        GROUP BY p.hsn_code, p.name, si.tax_value
        ORDER BY p.hsn_code ASC, p.name ASC
    ", [$startDate, $endDate]);

    $finalData = [];
    $sNo = 1;

    foreach ($rawData as $row) {
        // Tax-inclusive calculation
        $taxableValue = 0.0;
        $totalTax = 0.0;
        $cgst = 0.0;
        $sgst = 0.0;

        if ($row->tax_rate > 0) {
            $taxableValue = $row->gross_total / (1 + ($row->tax_rate / 100));
            $totalTax = $row->gross_total - $taxableValue;

            // Split into CGST and SGST
            $cgst = round($totalTax / 2, 2);
            $sgst = round($totalTax - $cgst, 2);
        } else {
            $taxableValue = $row->gross_total;
        }

        $finalData[] = [
            's_no'          => $sNo++,
            'hsn_code'      => $row->hsn_code,
            'product_name'  => $row->product_name,
            'total_qty'     => $row->total_qty,
            'tax_rate'      => $row->tax_rate,
            'taxable_value' => round($taxableValue, 2),
            'cgst_amount'   => $cgst,
            'sgst_amount'   => $sgst,
            'cess'          => 0.00,
            'total_tax'     => round($totalTax, 2),
            'total_amount'  => round($row->gross_total, 2)
        ];
    }

    // Export to Excel (you can make a separate HSN export class or reuse with custom headings)
    return Excel::download(
        new HsnSalesReportExport(collect($finalData), $startDate, $endDate),
        'hsn_sales_report.xlsx'
    );
}

public function hsnPurchaseReport(Request $request)
{
    $startDate = $request->input('start_date', '2025-07-01');
    $endDate = $request->input('end_date', '2025-07-31');

    $rawData = DB::select("
        SELECT 
            p.hsn_code,
            p.name AS product_name,
            SUM(pi.quantity) AS total_qty,
            SUM(pi.sub_total) AS gross_total,
            COALESCE(pi.tax_value, 0) AS tax_rate,
            ROUND(SUM(
                CASE 
                    WHEN pi.tax_value > 0 
                    THEN pi.sub_total / (1 + (pi.tax_value / 100)) 
                    ELSE pi.sub_total 
                END
            ), 2) AS taxable_value,
            ROUND(SUM(
                CASE 
                    WHEN pi.tax_value > 0 
                    THEN (pi.sub_total - (pi.sub_total / (1 + (pi.tax_value / 100)))) / 2
                    ELSE 0
                END
            ), 2) AS cgst_amount,
            ROUND(SUM(
                CASE 
                    WHEN pi.tax_value > 0 
                    THEN (pi.sub_total - (pi.sub_total / (1 + (pi.tax_value / 100)))) / 2
                    ELSE 0
                END
            ), 2) AS sgst_amount,
            ROUND(SUM(
                CASE 
                    WHEN pi.tax_value > 0 
                    THEN pi.sub_total - (pi.sub_total / (1 + (pi.tax_value / 100))) 
                    ELSE 0
                END
            ), 2) AS total_tax
        FROM purchase_items pi
        JOIN purchases pu ON pi.purchase_id = pu.id
        JOIN products p ON pi.product_id = p.id
        WHERE pu.date BETWEEN ? AND ?
        GROUP BY p.hsn_code, p.name, pi.tax_value
        ORDER BY p.hsn_code ASC, p.name ASC
    ", [$startDate, $endDate]);

    return Excel::download(
        new \App\Exports\HsnPurchaseReportExport(collect($rawData), $startDate, $endDate),
        'hsn_purchase_report.xlsx'
    );
}


public function gstrSummaryReport(Request $request)
{
    $startDate = $request->input('start_date', '2025-07-01');
    $endDate = $request->input('end_date', '2025-07-31');

    // Run the combined tax summary query for all four parts
    $summaryRows = DB::select("
        -- Sales
        SELECT
            'Sales' AS particulars,
            SUM(CASE WHEN tax_rate = 5 THEN tax_amount ELSE 0 END) AS tax_5,
            SUM(CASE WHEN tax_rate = 12 THEN tax_amount ELSE 0 END) AS tax_12,
            SUM(CASE WHEN tax_rate = 18 THEN tax_amount ELSE 0 END) AS tax_18,
            SUM(CASE WHEN tax_rate = 28 THEN tax_amount ELSE 0 END) AS tax_28,
            0 AS cess,
            SUM(tax_amount) AS total_tax
        FROM (
            SELECT COALESCE(items.tax_amount, items.sub_total - (items.sub_total / (1 + items.tax_value / 100))) AS tax_amount,
                   items.tax_value AS tax_rate
            FROM sale_items items
            JOIN sales s ON items.sale_id = s.id
            WHERE s.date BETWEEN ? AND ?
        ) sales

        UNION ALL

        -- Sales Return
        SELECT
            '(-) Sales Return' AS particulars,
            SUM(CASE WHEN tax_rate = 5 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 12 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 18 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 28 THEN tax_amount ELSE 0 END),
            0,
            SUM(tax_amount)
        FROM (
            SELECT COALESCE(items.tax_amount, items.sub_total - (items.sub_total / (1 + items.tax_value / 100))) AS tax_amount,
                   items.tax_value AS tax_rate
            FROM sale_return_items items
            JOIN sales_return sr ON items.sale_return_id = sr.id
            WHERE sr.date BETWEEN ? AND ?
        ) sales_return

        UNION ALL

        -- Purchase
        SELECT
            'Purchase' AS particulars,
            SUM(CASE WHEN tax_rate = 5 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 12 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 18 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 28 THEN tax_amount ELSE 0 END),
            0,
            SUM(tax_amount)
        FROM (
            SELECT COALESCE(items.tax_amount, items.sub_total - (items.sub_total / (1 + items.tax_value / 100))) AS tax_amount,
                   items.tax_value AS tax_rate
            FROM purchase_items items
            JOIN purchases p ON items.purchase_id = p.id
            WHERE p.date BETWEEN ? AND ?
        ) purchase

        UNION ALL

        -- Purchase Return
        SELECT
            '(-) Purchase Return' AS particulars,
            SUM(CASE WHEN tax_rate = 5 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 12 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 18 THEN tax_amount ELSE 0 END),
            SUM(CASE WHEN tax_rate = 28 THEN tax_amount ELSE 0 END),
            0,
            SUM(tax_amount)
        FROM (
            SELECT COALESCE(items.tax_amount, items.sub_total - (items.sub_total / (1 + items.tax_value / 100))) AS tax_amount,
                   items.tax_value AS tax_rate
            FROM purchases_return_items items
           JOIN purchases_return pr ON items.purchase_return_id = pr.id
            WHERE pr.date BETWEEN ? AND ?
        ) purchase_return
    ", [$startDate, $endDate, $startDate, $endDate, $startDate, $endDate, $startDate, $endDate]);

    // Calculate Output Tax (Sales - Sales Return) and Input Tax (Purchase - Purchase Return)
    $salesTax = collect($summaryRows)->where('particulars', 'Sales')->first();
    $salesReturnTax = collect($summaryRows)->where('particulars', '(-) Sales Return')->first();
    $purchaseTax = collect($summaryRows)->where('particulars', 'Purchase')->first();
    $purchaseReturnTax = collect($summaryRows)->where('particulars', '(-) Purchase Return')->first();

    $outputTax = [
        'tax_5' => ($salesTax->tax_5 ?? 0) - ($salesReturnTax->tax_5 ?? 0),
        'tax_12' => ($salesTax->tax_12 ?? 0) - ($salesReturnTax->tax_12 ?? 0),
        'tax_18' => ($salesTax->tax_18 ?? 0) - ($salesReturnTax->tax_18 ?? 0),
        'tax_28' => ($salesTax->tax_28 ?? 0) - ($salesReturnTax->tax_28 ?? 0),
        'cess' => 0,
        'total_tax' => ($salesTax->total_tax ?? 0) - ($salesReturnTax->total_tax ?? 0),
    ];

    $inputTax = [
        'tax_5' => ($purchaseTax->tax_5 ?? 0) - ($purchaseReturnTax->tax_5 ?? 0),
        'tax_12' => ($purchaseTax->tax_12 ?? 0) - ($purchaseReturnTax->tax_12 ?? 0),
        'tax_18' => ($purchaseTax->tax_18 ?? 0) - ($purchaseReturnTax->tax_18 ?? 0),
        'tax_28' => ($purchaseTax->tax_28 ?? 0) - ($purchaseReturnTax->tax_28 ?? 0),
        'cess' => 0,
        'total_tax' => ($purchaseTax->total_tax ?? 0) - ($purchaseReturnTax->total_tax ?? 0),
    ];

    $taxPayable = $outputTax['total_tax'] - $inputTax['total_tax'];

    // Prepare final array for export or display
    $finalData = [];

    // Add rows for summary
    foreach ($summaryRows as $row) {
        $finalData[] = [
            'particulars' => $row->particulars,
            'tax_5' => round($row->tax_5, 2),
            'tax_12' => round($row->tax_12, 2),
            'tax_18' => round($row->tax_18, 2),
            'tax_28' => round($row->tax_28, 2),
            'cess' => round($row->cess, 2),
            'total_tax' => round($row->total_tax, 2),
        ];
    }

    // Add Output Tax row
    $finalData[] = [
        'particulars' => 'Output Tax:',
        'tax_5' => '',
        'tax_12' => '',
        'tax_18' => '',
        'tax_28' => '',
        'cess' => '',
        'total_tax' => round($outputTax['total_tax'], 2),
    ];

    // Add Input Tax row
    $finalData[] = [
        'particulars' => 'Input Tax:',
        'tax_5' => '',
        'tax_12' => '',
        'tax_18' => '',
        'tax_28' => '',
        'cess' => '',
        'total_tax' => round($inputTax['total_tax'], 2),
    ];

    // Add Tax Payable row
    $finalData[] = [
        'particulars' => 'Tax Payable',
        'tax_5' => '',
        'tax_12' => '',
        'tax_18' => '',
        'tax_28' => '',
        'cess' => '',
        'total_tax' => round($taxPayable, 2),
    ];

    // Return as JSON or send to Excel export class
    return Excel::download(new GstrSummaryExport(collect($finalData), $startDate, $endDate), 'gstr_summary_report.xlsx');
}


}

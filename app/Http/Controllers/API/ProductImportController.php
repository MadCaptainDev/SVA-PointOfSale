<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Imports\ProductImport;
use App\Models\ImportLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ProductImportController extends Controller
{
    // ── POST /api/products/import ────────────────────────────────────────────
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file'    => 'required|file|mimes:xlsx,xls',
            'dry_run' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => false,
                'message' => 'Invalid file upload',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $isDryRun = filter_var($request->input('dry_run', false), FILTER_VALIDATE_BOOLEAN);

        try {
            $importer = new ProductImport($isDryRun);
            Excel::import($importer, $request->file('file'));

            $results   = $importer->results;
            $imported  = $importer->imported;
            $failed    = $importer->failed;
            $skipped   = $importer->skipped;
            $totalRows = count($results);

            // Determine overall status
            if ($isDryRun) {
                $status = 'dry_run';
            } elseif ($failed === 0 && $skipped === 0) {
                $status = 'success';
            } elseif ($imported > 0) {
                $status = 'partial';
            } else {
                $status = 'failed';
            }

            // Generate error report Excel if any failures
            $errorReportPath = null;
            if (!$isDryRun && $failed > 0) {
                $errorReportPath = $this->generateErrorReport($results, $request->file('file')->getClientOriginalName());
            }

            // Save import log
            $log = ImportLog::create([
                'file_name'         => $request->file('file')->getClientOriginalName(),
                'total_rows'        => $totalRows,
                'imported'          => $imported,
                'failed'            => $failed,
                'skipped'           => $skipped,
                'status'            => $status,
                'results'           => $results,
                'error_report_path' => $errorReportPath,
                'is_dry_run'        => $isDryRun,
            ]);

            return response()->json([
                'status'           => true,
                'message'          => $isDryRun
                    ? "Dry run complete: {$imported} would import, {$skipped} would skip."
                    : "Import complete: {$imported} imported, {$failed} failed, {$skipped} skipped.",
                'log_id'           => $log->id,
                'imported'         => $imported,
                'failed'           => $failed,
                'skipped'          => $skipped,
                'total'            => $totalRows,
                'import_status'    => $status,
                'results'          => $results,
                'has_error_report' => !is_null($errorReportPath),
            ]);
        } catch (\Exception $e) {
            Log::error('Import exception: ' . $e->getMessage());
            return response()->json([
                'status'  => false,
                'message' => 'Import failed.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // ── GET /api/import-logs ─────────────────────────────────────────────────
    public function history()
    {
        $logs = ImportLog::select([
            'id', 'file_name', 'total_rows', 'imported',
            'failed', 'skipped', 'status', 'is_dry_run',
            'error_report_path', 'created_at',
        ])->orderByDesc('created_at')->get();

        return response()->json(['status' => true, 'data' => $logs]);
    }

    // ── GET /api/import-logs/{id} ────────────────────────────────────────────
    public function show($id)
    {
        $log = ImportLog::findOrFail($id);
        return response()->json(['status' => true, 'data' => $log]);
    }

    // ── GET /api/import-logs/{id}/error-report ───────────────────────────────
    public function downloadErrorReport($id)
    {
        $log = ImportLog::findOrFail($id);

        if (!$log->error_report_path) {
            return response()->json(['status' => false, 'message' => 'No error report available.'], 404);
        }

        $disk = config('app.media_disc', 'public');

        if (!Storage::disk($disk)->exists($log->error_report_path)) {
            return response()->json(['status' => false, 'message' => 'Error report file not found.'], 404);
        }

        $fullPath = Storage::disk($disk)->path($log->error_report_path);
        return response()->download($fullPath, basename($log->error_report_path));
    }

    // ── Private: generate error Excel ────────────────────────────────────────
    private function generateErrorReport(array $results, string $originalFileName): string
    {
        $failedRows = array_filter($results, fn($r) => $r['status'] === 'failed');

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Failed Rows');

        // Header
        $headers = ['Row', 'Product Name', 'Product Code', 'Error'];
        foreach ($headers as $col => $header) {
            $cell = $sheet->getCellByColumnAndRow($col + 1, 1);
            $cell->setValue($header);
            $cell->getStyle()->getFont()->setBold(true);
            $cell->getStyle()->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D32F2F');
            $cell->getStyle()->getFont()->getColor()->setRGB('FFFFFF');
            $cell->getStyle()->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // Data rows
        $rowIndex = 2;
        foreach ($failedRows as $r) {
            $sheet->getCellByColumnAndRow(1, $rowIndex)->setValue($r['row']);
            $sheet->getCellByColumnAndRow(2, $rowIndex)->setValue($r['name']);
            $sheet->getCellByColumnAndRow(3, $rowIndex)->setValue($r['code']);
            $sheet->getCellByColumnAndRow(4, $rowIndex)->setValue($r['error']);
            $rowIndex++;
        }

        // Column widths
        $sheet->getColumnDimension('A')->setWidth(8);
        $sheet->getColumnDimension('B')->setWidth(35);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(60);

        // Border around data
        $lastRow = $rowIndex - 1;
        if ($lastRow >= 2) {
            $sheet->getStyle("A1:D{$lastRow}")->getBorders()->getAllBorders()
                ->setBorderStyle(Border::BORDER_THIN);
        }

        $timestamp = now()->format('Ymd_His');
        $fileName  = 'import_errors_' . $timestamp . '.xlsx';
        $path      = 'import_error_reports/' . $fileName;

        $disk = config('app.media_disc', 'public');
        $tmpFile = tempnam(sys_get_temp_dir(), 'import_err_');
        $writer = new Xlsx($spreadsheet);
        $writer->save($tmpFile);
        Storage::disk($disk)->put($path, file_get_contents($tmpFile));
        @unlink($tmpFile);

        return $path;
    }
}

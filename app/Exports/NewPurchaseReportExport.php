<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;

class NewPurchaseReportExport implements FromCollection, WithMapping, WithHeadings, ShouldAutoSize, WithEvents
{
    protected $data;
    protected $totalGrand = 0;
    protected $startDate;
    protected $endDate;

    public function __construct(Collection $data, string $startDate, string $endDate)
    {
        $this->data = $data;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function collection()
    {
        return $this->data;
    }

    public function map($row): array
    {
        $this->totalGrand += $row['grand_total'];

        return [
            $row['s_no'],
            $row['supplier_name'],
            $row['reference_codes'],
            $row['purchase_date'],
            $row['tax_rate'],
            $row['taxable_value'],
            $row['igst_amount'],
            $row['cgst_amount'],
            $row['grand_total'],
        ];
    }

    public function headings(): array
    {
        return [
            ["Purchase Report – From {$this->startDate} to {$this->endDate}"],
            ['S.No', 'Supplier Name', 'Reference Codes', 'Purchase Date', 'Tax Rate (%)', 'Taxable Value', 'IGST Amount', 'CGST Amount', 'Grand Total']
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Merge and style title row
                $sheet->mergeCells('A1:I1');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

                // Style header row
                $sheet->getStyle('A2:I2')->getFont()->setBold(true);
                $sheet->getStyle('A2:I2')->getAlignment()->setHorizontal('center');

                // Total row
                $rowCount = $this->data->count() + 3;
                $sheet->setCellValue("H{$rowCount}", "Total");
                $sheet->setCellValue("I{$rowCount}", round($this->totalGrand, 2));
                $sheet->getStyle("H{$rowCount}:I{$rowCount}")->getFont()->setBold(true);

                // Format numeric columns with 2 decimals
                $sheet->getStyle("F3:I{$rowCount}")
                      ->getNumberFormat()
                      ->setFormatCode('#,##0.00');
            }
        ];
    }
}

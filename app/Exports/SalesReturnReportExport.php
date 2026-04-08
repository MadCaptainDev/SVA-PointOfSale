<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;

class SalesReturnReportExport implements FromCollection, WithMapping, WithHeadings, ShouldAutoSize, WithEvents
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
        // Use serial_no from SQL query
        $serialNo = $row->serial_no ?? null;

        // Safely accumulate total amount
        $this->totalGrand += $row->total_amount ?? 0;

        return [
            $serialNo,
            $row->customer_name ?? '',
            '', // Customer GST (empty for now)
            $row->invoice_no ?? '',
            $row->invoice_date ?? '',
            $row->tax_rate ?? 0,
            $row->taxable_value ?? 0,
            $row->cgst_amount ?? 0,
            $row->sgst_amount ?? 0,
            $row->cess ?? 0,
            $row->total_tax ?? 0,
            $row->total_amount ?? 0,
        ];
    }

    public function headings(): array
    {
        return [
            ["Sales Return Report – From {$this->startDate} to {$this->endDate}"],
            [
                'S.No',
                'Name of Customer',
                'Customer GST',
                'Invoice No',
                'Invoice Date',
                'Rate of Tax (%)',
                'Taxable Value',
                'CGST Amount',
                'SGST/UTGST Amount',
                'Cess',
                'Total Tax',
                'Total Amount'
            ]
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Merge and style title row
                $sheet->mergeCells('A1:L1');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

                // Style header row
                $sheet->getStyle('A2:L2')->getFont()->setBold(true);
                $sheet->getStyle('A2:L2')->getAlignment()->setHorizontal('center');

                // Total row
                $rowCount = $this->data->count() + 3;
                $sheet->setCellValue("K{$rowCount}", "Total");
                $sheet->setCellValue("L{$rowCount}", round($this->totalGrand, 2));
                $sheet->getStyle("K{$rowCount}:L{$rowCount}")->getFont()->setBold(true);

                // Format numeric columns
                $sheet->getStyle("G3:L{$rowCount}")
                      ->getNumberFormat()
                      ->setFormatCode('#,##0.00');
            }
        ];
    }
}

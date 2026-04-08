<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;

class NewSalesReportExport implements FromCollection, WithMapping, WithHeadings, ShouldAutoSize, WithEvents
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
    $this->totalGrand += $row['total_amount'];

    return [
        $row['s_no'],
        $row['customer_name'],
        '', // Customer GST (empty for now)
        $row['invoice_no'],
        $row['invoice_date'],
        $row['tax_rate'],
        $row['taxable_value'],
        $row['cgst_amount'],
        $row['sgst_amount'],
        $row['cess'],
        $row['total_tax'],
        $row['total_amount'],
    ];
}

public function headings(): array
{
    return [
        ["Sales Report – From {$this->startDate} to {$this->endDate}"],
        [
            'S.No',
            'Name of Customer',
            'Customer GST', // new column
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

            // Merge and style title row (A → L now because 12 columns)
            $sheet->mergeCells('A1:L1');
            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
            $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

            // Style header row
            $sheet->getStyle('A2:L2')->getFont()->setBold(true);
            $sheet->getStyle('A2:L2')->getAlignment()->setHorizontal('center');

            // Total row
            $rowCount = $this->data->count() + 3;
            $sheet->setCellValue("K{$rowCount}", "Total"); // Shifted to K
            $sheet->setCellValue("L{$rowCount}", round($this->totalGrand, 2));
            $sheet->getStyle("K{$rowCount}:L{$rowCount}")->getFont()->setBold(true);

            // Format numeric columns (now G → L because of GST column)
            $sheet->getStyle("G3:L{$rowCount}")
                  ->getNumberFormat()
                  ->setFormatCode('#,##0.00');
        }
    ];
}

    
}

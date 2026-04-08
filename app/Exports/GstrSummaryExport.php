<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;

class GstrSummaryExport implements FromCollection, WithMapping, WithHeadings, ShouldAutoSize, WithEvents
{
    protected $data;
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
        return [
            $row['particulars'],
            $row['tax_5'],
            $row['tax_12'],
            $row['tax_18'],
            $row['tax_28'],
            $row['cess'],
            $row['total_tax'],
        ];
    }

    public function headings(): array
    {
        return [
            ["GSTR - Summary"],
            ["Date from: {$this->startDate}  To: {$this->endDate}"],
            [
                'Particulars',
                '5% Tax Amount',
                '12% Tax Amount',
                '18% Tax Amount',
                '28% Tax Amount',
                'Cess',
                'Total Tax Amount',
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();

                // Merge and style title rows
                $sheet->mergeCells('A1:G1');
                $sheet->mergeCells('A2:G2');

                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');
                $sheet->getStyle('A2')->getFont()->setBold(true)->setSize(12);
                $sheet->getStyle('A2')->getAlignment()->setHorizontal('center');

                // Header row styling
                $sheet->getStyle('A3:G3')->getFont()->setBold(true);
                $sheet->getStyle('A3:G3')->getAlignment()->setHorizontal('center');

                // Format all numeric columns with 2 decimals (columns B to G)
                $rowCount = $this->data->count() + 3;
                $sheet->getStyle("B4:G{$rowCount}")
                      ->getNumberFormat()
                      ->setFormatCode('#,##0.00');

                // Bold Particulars column for totals (Output Tax, Input Tax, Tax Payable)
                foreach (['A', 'B', 'C', 'D', 'E', 'F', 'G'] as $col) {
                    for ($row = $rowCount - 2; $row <= $rowCount; $row++) {
                        $sheet->getStyle("{$col}{$row}")->getFont()->setBold(true);
                    }
                }
            }
        ];
    }
}

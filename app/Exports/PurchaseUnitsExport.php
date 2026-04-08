<?php

namespace App\Exports;

use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PurchaseUnitsExport implements FromCollection, WithHeadings
{
    protected $reference;

    public function __construct($reference)
    {
        $this->reference = $reference;
    }

    public function collection()
    {
        $query = "
          WITH RECURSIVE numbers AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 
    FROM numbers 
    WHERE n < 1000
)
SELECT 
    p.code AS barcode,
    p.name AS iname,
    CONCAT('₹', FORMAT(p.product_price, 2)) AS retail_price
FROM purchase_items pi
JOIN products p ON pi.product_id = p.id
JOIN numbers n ON n.n <= pi.quantity
JOIN purchases pur ON pi.purchase_id = pur.id
WHERE pur.reference_code = ?
ORDER BY pi.id, n.n;

        ";

        $results = DB::select($query, [$this->reference]);

        // Convert stdClass to collection
        return collect($results)->map(function($item) {
            return (array) $item;
        });
    }

    public function headings(): array
    {
        return ['barcode', 'iname', 'retail_price'];
    }
}

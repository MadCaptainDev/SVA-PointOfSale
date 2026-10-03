<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\AppBaseController;
use App\Models\Expense;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\SalesPayment;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Compact daily earnings summary for home-screen widgets (e.g. iPhone Scriptable).
 */
class WidgetAPIController extends AppBaseController
{
    // App runs in UTC, but the store's business day is in India.
    private const STORE_TIMEZONE = 'Asia/Kolkata';

    public function dailyEarnings(Request $request): JsonResponse
    {
        $now = Carbon::now(self::STORE_TIMEZONE);
        $date = $request->filled('date')
            ? Carbon::parse($request->get('date'), self::STORE_TIMEZONE)->toDateString()
            : $now->toDateString();

        $today = $this->daySummary($date);
        $yesterday = $this->daySummary(Carbon::parse($date)->subDay()->toDateString());

        // Last 7 days of net sales for a trend line, oldest first.
        $start = Carbon::parse($date)->subDays(6)->toDateString();
        $sales = Sale::whereBetween('date', [$start, $date])
            ->selectRaw('date, SUM(grand_total) as total')->groupBy('date')->pluck('total', 'date');
        $returns = SaleReturn::whereBetween('date', [$start, $date])
            ->selectRaw('date, SUM(grand_total) as total')->groupBy('date')->pluck('total', 'date');
        $week = [];
        foreach (CarbonPeriod::create($start, $date) as $day) {
            $key = $day->toDateString();
            $week[] = [
                'date' => $key,
                'net_sales' => round((float) ($sales[$key] ?? 0) - (float) ($returns[$key] ?? 0), 2),
            ];
        }

        return $this->sendResponse([
            'store' => config('app.name'),
            'date' => $date,
            'generated_at' => $now->toIso8601String(),
            'today' => $today,
            'yesterday' => $yesterday,
            'last_7_days' => $week,
        ], 'Daily earnings retrieved successfully');
    }

    private function daySummary(string $date): array
    {
        $salesTotal = (float) Sale::where('date', $date)->sum('grand_total');
        $billsCount = Sale::where('date', $date)->count();
        $returnsTotal = (float) SaleReturn::where('date', $date)->sum('grand_total');
        $expenses = (float) Expense::where('date', $date)->sum('amount');

        $payments = SalesPayment::where('payment_date', $date)
            ->selectRaw('payment_type, SUM(amount) as total')
            ->groupBy('payment_type')
            ->pluck('total', 'payment_type');

        // Same cost basis as the Profit & Loss report: product_cost x quantity.
        $soldCost = (float) DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.date', $date)
            ->sum(DB::raw('products.product_cost * sale_items.quantity'));
        $returnedCost = (float) DB::table('sale_return_items')
            ->join('sales_return', 'sales_return.id', '=', 'sale_return_items.sale_return_id')
            ->join('products', 'products.id', '=', 'sale_return_items.product_id')
            ->where('sales_return.date', $date)
            ->sum(DB::raw('products.product_cost * sale_return_items.quantity'));

        $netSales = $salesTotal - $returnsTotal;
        $grossProfit = $netSales - ($soldCost - $returnedCost);

        return [
            'sales' => round($salesTotal, 2),
            'bills' => $billsCount,
            'returns' => round($returnsTotal, 2),
            'net_sales' => round($netSales, 2),
            'collected' => round((float) $payments->sum(), 2),
            'collected_by_mode' => [
                'cash' => round((float) ($payments[SalesPayment::CASH] ?? 0), 2),
                'cheque' => round((float) ($payments[SalesPayment::CHEQUE] ?? 0), 2),
                'bank_transfer' => round((float) ($payments[SalesPayment::BANK_TRANSFER] ?? 0), 2),
                'other' => round((float) ($payments[SalesPayment::OTHER] ?? 0), 2),
            ],
            'expenses' => round($expenses, 2),
            'gross_profit' => round($grossProfit, 2),
            'net_earning' => round($grossProfit - $expenses, 2),
        ];
    }
}

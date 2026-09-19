<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminShare;
use App\Services\AdminShareService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminShareController extends Controller
{
    /**
     * Get all seller shares with filters and overview metrics.
     */
    public function index(Request $request)
    {
        // Keep shares and suspensions updated in real-time
        AdminShareService::syncSharesForMonth();
        AdminShareService::checkAndApplyAutoSuspensions();

        $query = AdminShare::with([
            'seller:id,fullname,username,phone,status,email',
            'farm:id,name,location,permit_status',
        ])->orderBy('billing_period', 'desc')->orderBy('status', 'asc');

        // Status filter: 'all', 'unpaid', 'paid', 'overdue'
        $status = $request->query('status');
        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        // Period filter (YYYY-MM)
        $period = $request->query('period');
        if ($period && $period !== 'all') {
            $query->where('billing_period', $period);
        }

        // Search filter
        $search = $request->query('search');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('seller', function ($s) use ($search) {
                    $s->where('fullname', 'like', "%{$search}%")
                      ->orWhere('username', 'like', "%{$search}%");
                })->orWhereHas('farm', function ($f) use ($search) {
                    $f->where('name', 'like', "%{$search}%");
                });
            });
        }

        $shares = $query->get();

        // Summary calculations
        $currentMonth = now()->format('Y-m');

        $totalCollectedCurrentMonth = (float) AdminShare::where('billing_period', $currentMonth)
            ->where('status', 'paid')
            ->sum('share_amount');

        $totalDueCurrentMonth = (float) AdminShare::where('billing_period', $currentMonth)
            ->where('status', 'unpaid')
            ->sum('share_amount');

        $totalOverdueAmount = (float) AdminShare::where('status', 'overdue')
            ->sum('share_amount');

        $overdueCount = AdminShare::where('status', 'overdue')->count();

        $unpaidSellersCount = AdminShare::whereIn('status', ['unpaid', 'overdue'])
            ->where('share_amount', '>', 0)
            ->distinct('seller_id')
            ->count('seller_id');

        // Distinct billing periods available
        $availablePeriods = AdminShare::distinct('billing_period')
            ->orderBy('billing_period', 'desc')
            ->pluck('billing_period');

        return response()->json([
            'shares' => $shares,
            'summary' => [
                'current_month' => $currentMonth,
                'total_collected_month' => $totalCollectedCurrentMonth,
                'total_due_month' => $totalDueCurrentMonth,
                'total_overdue_amount' => $totalOverdueAmount,
                'overdue_count' => $overdueCount,
                'unpaid_sellers_count' => $unpaidSellersCount,
            ],
            'available_periods' => $availablePeriods,
        ]);
    }

    /**
     * Mark an admin share as paid by Admin.
     */
    public function markPaid(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'reference' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $share = AdminShareService::markAsPaid(
            $id,
            $request->input('reference'),
            $request->input('notes')
        );

        return response()->json([
            'message' => 'Admin share marked as paid successfully.',
            'share' => $share,
        ]);
    }

    /**
     * Trigger manual sync of seller shares.
     */
    public function sync(Request $request)
    {
        $period = $request->input('period', now()->format('Y-m'));
        AdminShareService::syncSharesForMonth($period);
        AdminShareService::checkAndApplyAutoSuspensions();

        return response()->json([
            'message' => "Shares for {$period} synchronized successfully.",
        ]);
    }
}

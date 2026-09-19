<?php

namespace App\Services;

use App\Models\AdminShare;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;

class AdminShareService
{
    /**
     * Sync and calculate 5% admin share for a billing period (format: YYYY-MM).
     */
    public static function syncSharesForMonth(?string $period = null): void
    {
        $period = $period ?: now()->format('Y-m');
        $periodStart = Carbon::parse($period . '-01')->startOfMonth();
        $periodEnd = Carbon::parse($period . '-01')->endOfMonth();

        // Due date: 5th of the next month
        $dueDate = Carbon::parse($period . '-01')->addMonth()->setDay(5)->toDateString();
        // Grace period: Due date + 7 days
        $graceDate = Carbon::parse($dueDate)->addDays(7)->toDateString();

        $sellers = User::whereIn('role', ['seller', 'reseller'])
            ->with('farm')
            ->get();

        foreach ($sellers as $seller) {
            $farm = $seller->farm;
            if (!$farm) {
                continue;
            }

            // Calculate completed revenue for this seller during the billing period
            $revenue = (float) Order::where('farm_id', $farm->id)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$periodStart, $periodEnd])
                ->sum('total');

            $shareAmount = round($revenue * 0.05, 2);

            $share = AdminShare::where('seller_id', $seller->id)
                ->where('billing_period', $period)
                ->first();

            $isPastGrace = now()->startOfDay()->gt(Carbon::parse($graceDate)->endOfDay());

            if ($share) {
                // If not already paid, update values
                if ($share->status !== 'paid') {
                    $share->total_revenue = $revenue;
                    $share->share_amount = $shareAmount;
                    $share->farm_id = $farm->id;
                    $share->due_date = $dueDate;
                    $share->grace_period_date = $graceDate;

                    if ($isPastGrace && $shareAmount > 0) {
                        $share->status = 'overdue';
                        self::suspendSellerForOverdue($seller, $farm, $share);
                    }
                    $share->save();
                }
            } else {
                // Create share record if there is revenue or seller has listings
                $status = ($isPastGrace && $shareAmount > 0) ? 'overdue' : 'unpaid';
                $newShare = AdminShare::create([
                    'seller_id' => $seller->id,
                    'farm_id' => $farm->id,
                    'billing_period' => $period,
                    'period_start' => $periodStart->toDateString(),
                    'period_end' => $periodEnd->toDateString(),
                    'total_revenue' => $revenue,
                    'share_percentage' => 5.00,
                    'share_amount' => $shareAmount,
                    'due_date' => $dueDate,
                    'grace_period_date' => $graceDate,
                    'status' => $status,
                ]);

                if ($status === 'overdue') {
                    self::suspendSellerForOverdue($seller, $farm, $newShare);
                }
            }
        }
    }

    /**
     * Check all unpaid shares and automatically suspend shops failing to pay past grace period.
     */
    public static function checkAndApplyAutoSuspensions(): void
    {
        $today = now()->startOfDay();

        $overdueShares = AdminShare::with(['seller', 'farm'])
            ->where('status', 'unpaid')
            ->where('share_amount', '>', 0)
            ->whereDate('grace_period_date', '<', $today)
            ->get();

        foreach ($overdueShares as $share) {
            $share->status = 'overdue';
            $share->save();

            if ($share->seller && $share->farm) {
                self::suspendSellerForOverdue($share->seller, $share->farm, $share);
            }
        }
    }

    /**
     * Suspend seller and farm due to overdue platform share.
     */
    private static function suspendSellerForOverdue(User $seller, $farm, AdminShare $share): void
    {
        if ($seller->status !== 'suspended') {
            $seller->status = 'suspended';
            $seller->save();

            if ($farm && $farm->permit_status !== 'suspended') {
                $farm->permit_status = 'suspended';
                $farm->save();
            }

            ActivityLogService::log(
                "Automated system suspended seller {$seller->username} (Farm: {$farm->name}) due to overdue 5% share for period {$share->billing_period} (₱{$share->share_amount})",
                $seller->id
            );
        }
    }

    /**
     * Mark an admin share as paid and restore seller if no other overdue shares exist.
     */
    public static function markAsPaid(int $shareId, ?string $reference = null, ?string $notes = null): AdminShare
    {
        $share = AdminShare::with(['seller', 'farm'])->findOrFail($shareId);
        $share->status = 'paid';
        $share->paid_at = now();
        if ($reference) {
            $share->payment_reference = $reference;
        }
        if ($notes) {
            $share->notes = $notes;
        }
        $share->save();

        // Check if seller has other overdue shares
        $hasOtherOverdue = AdminShare::where('seller_id', $share->seller_id)
            ->where('status', 'overdue')
            ->where('id', '!=', $shareId)
            ->exists();

        if (!$hasOtherOverdue && $share->seller && $share->seller->status === 'suspended') {
            // Restore seller and farm
            $share->seller->status = 'verified';
            $share->seller->save();

            if ($share->farm) {
                $share->farm->permit_status = 'approved';
                $share->farm->save();
            }

            ActivityLogService::log(
                "Seller {$share->seller->username} reinstated to verified after settling overdue 5% share for {$share->billing_period}",
                $share->seller->id
            );
        }

        ActivityLogService::log(
            "Admin marked 5% share for period {$share->billing_period} (₱{$share->share_amount}) as PAID for seller {$share->seller->username}"
        );

        return $share->load(['seller', 'farm']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RiderOrderController extends Controller
{
    /**
     * Get all orders assigned to the authenticated rider.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $rider = $user->rider;

        if (!$rider) {
            return response()->json(['orders' => []]);
        }

        $orders = Order::with(['customer:id,fullname,username,phone', 'farm:id,name,location', 'items.product:id,name,image,category'])
            ->where('rider_id', $rider->id)
            ->latest()
            ->get();

        return response()->json(['orders' => $orders]);
    }

    /**
     * Get details of a specific order assigned to the rider.
     */
    public function show(Request $request, int $id)
    {
        $user = $request->user();
        $rider = $user->rider;

        if (!$rider) {
            return response()->json(['message' => 'Rider profile not found.'], 403);
        }

        $order = Order::with(['customer:id,fullname,username,phone', 'farm:id,name,location', 'items.product:id,name,image,category'])
            ->where('rider_id', $rider->id)
            ->findOrFail($id);

        return response()->json(['order' => $order]);
    }

    /**
     * Update the status of an order. Rider can only set: out_for_delivery, completed, cancelled.
     */
    public function updateStatus(Request $request, int $id)
    {
        $user = $request->user();
        $rider = $user->rider;

        if (!$rider) {
            return response()->json(['message' => 'Rider profile not found.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', 'in:out_for_delivery,completed,cancelled'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $order = Order::with('items')->where('rider_id', $rider->id)->findOrFail($id);
        $oldStatus = $order->status;
        $newStatus = $request->input('status');

        if ($oldStatus === $newStatus) {
            return response()->json(['order' => $order->load(['customer', 'items.product', 'farm'])]);
        }

        DB::transaction(function () use ($order, $newStatus, $oldStatus) {
            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                foreach ($order->items as $item) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->increment('stock_' . $item->size, $item->quantity);
                        $product->increment('stock', $item->quantity);
                    }
                }
            } elseif ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
                foreach ($order->items as $item) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->decrement('stock_' . $item->size, $item->quantity);
                        $product->decrement('stock', $item->quantity);
                    }
                }
            }

            $order->status = $newStatus;
            $order->save();
        });

        ActivityLogService::log(
            "Rider '{$rider->fullname}' updated order #{$order->id} status to '{$newStatus}'",
            $user->id
        );

        return response()->json(['order' => $order->load(['customer', 'items.product', 'farm'])]);
    }
}

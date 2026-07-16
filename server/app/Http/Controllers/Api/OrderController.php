<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = Order::with(['farm:id,name,location', 'items.product:id,name,image'])
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function show(Request $request, int $id)
    {
        $order = Order::with(['farm:id,name,location', 'items.product:id,name,image,category', 'rider'])
            ->where('customer_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json(['order' => $order]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.size' => ['required', 'in:small,medium,large,jumbo'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'delivery_type' => ['required', 'in:pickup,delivery'],
            'payment_method' => ['required', 'in:cash_on_pickup,cash_on_delivery'],
            'address_line' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'province' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:30'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($data['delivery_type'] === 'delivery') {
            if (empty($data['address_line']) || empty($data['city']) || empty($data['phone'])) {
                return response()->json(['message' => 'Delivery address and phone are required'], 422);
            }
        }

        try {
            $order = DB::transaction(function () use ($request, $data) {
                $total = 0;
                $farmId = null;
                $lineItems = [];

                foreach ($data['items'] as $item) {
                    $product = Product::with('farm')->findOrFail($item['product_id']);

                    if ($product->farm->permit_status !== 'approved') {
                        throw new \RuntimeException('Product farm is not approved');
                    }

                    $sizeStock = $product->stockForSize($item['size']);
                    if ($sizeStock < $item['quantity']) {
                        throw new \RuntimeException("Insufficient stock for {$product->name} ({$item['size']})");
                    }

                    if ($farmId === null) {
                        $farmId = $product->farm_id;
                    } elseif ($farmId !== $product->farm_id) {
                        throw new \RuntimeException('All items must be from the same farm');
                    }

                    $unitPrice = $product->priceForSize($item['size']);
                    $subtotal = $unitPrice * $item['quantity'];
                    $total += $subtotal;

                    $lineItems[] = [
                        'product_id' => $product->id,
                        'size' => $item['size'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'subtotal' => $subtotal,
                    ];

                    $product->decrement('stock_' . $item['size'], $item['quantity']);
                    $product->decrement('stock', $item['quantity']);
                }

                $order = Order::create([
                    'customer_id' => $request->user()->id,
                    'farm_id' => $farmId,
                    'status' => 'pending',
                    'delivery_type' => $data['delivery_type'],
                    'payment_method' => $data['payment_method'],
                    'total' => $total,
                    'address_line' => $data['address_line'] ?? null,
                    'city' => $data['city'] ?? null,
                    'province' => $data['province'] ?? null,
                    'postal_code' => $data['postal_code'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]);

                foreach ($lineItems as $line) {
                    OrderItem::create(array_merge($line, ['order_id' => $order->id]));
                }

                return $order->load(['items.product', 'farm']);
            });

            ActivityLogService::log('Order placed #' . $order->id, $request->user()->id);

            return response()->json(['order' => $order], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Get all orders for the authenticated seller's farm.
     */
    public function sellerIndex(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['orders' => []]);
        }

        $orders = Order::with(['customer:id,fullname,username,phone', 'items.product:id,name,image,category', 'rider'])
            ->where('farm_id', $farm->id)
            ->latest()
            ->get();

        return response()->json(['orders' => $orders]);
    }

    /**
     * Update the status of an order.
     */
    public function updateStatus(Request $request, int $id)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['message' => 'Farm not configured.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', 'in:pending,confirmed,processing,ready,completed,cancelled'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $order = Order::with('items')->where('farm_id', $farm->id)->findOrFail($id);
        $oldStatus = $order->status;
        $newStatus = $request->input('status');

        if ($oldStatus === $newStatus) {
            return response()->json(['order' => $order->load(['customer', 'items.product', 'rider'])]);
        }

        DB::transaction(function () use ($order, $newStatus, $oldStatus) {
            // Replenish stock if order is cancelled
            if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
                foreach ($order->items as $item) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->increment('stock_' . $item->size, $item->quantity);
                        $product->increment('stock', $item->quantity);
                    }
                }
            }
            // Decrement stock if uncancelled (unlikely path but good to support)
            elseif ($oldStatus === 'cancelled' && $newStatus !== 'cancelled') {
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
            "Order #{$order->id} status updated from '{$oldStatus}' to '{$newStatus}'",
            $user->id
        );

        return response()->json(['order' => $order->load(['customer', 'items.product', 'rider'])]);
    }

    /**
     * Assign a rider to a delivery order.
     */
    public function assignRider(Request $request, int $id)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['message' => 'Farm not configured.'], 403);
        }

        $order = Order::where('farm_id', $farm->id)->findOrFail($id);

        if ($order->delivery_type !== 'delivery') {
            return response()->json(['message' => 'Rider can only be assigned to delivery orders.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'rider_id' => ['required', 'integer', 'exists:riders,id'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $riderId = $request->input('rider_id');
        $rider = Rider::where('farm_id', $farm->id)->findOrFail($riderId);

        $order->rider_id = $rider->id;
        $order->rider_name = $rider->fullname;
        $order->save();

        ActivityLogService::log(
            "Rider '{$rider->fullname}' assigned to order #{$order->id}",
            $user->id
        );

        return response()->json(['order' => $order->load(['customer', 'items.product', 'rider'])]);
    }

    /**
     * Get sales report data for the seller's farm.
     */
    public function salesReport(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['message' => 'Farm not configured.'], 403);
        }

        // Get completed orders
        $completedOrders = Order::with(['items.product', 'customer'])
            ->where('farm_id', $farm->id)
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->get();

        $totalRevenue = $completedOrders->sum('total');
        $ordersCount = $completedOrders->count();
        
        $totalItemsSold = 0;
        $categoryBreakdown = [
            'broiler' => 0,
            'native' => 0,
            'eggs' => 0,
            'dressed_chicken' => 0,
        ];
        
        $productSales = [];

        foreach ($completedOrders as $order) {
            foreach ($order->items as $item) {
                $totalItemsSold += $item->quantity;
                $product = $item->product;
                if ($product) {
                    $cat = $product->category;
                    if (array_key_exists($cat, $categoryBreakdown)) {
                        $categoryBreakdown[$cat] += $item->subtotal;
                    } else {
                        $categoryBreakdown[$cat] = $item->subtotal;
                    }

                    if (!isset($productSales[$product->id])) {
                        $productSales[$product->id] = [
                            'id' => $product->id,
                            'name' => $product->name,
                            'image' => $product->image,
                            'category' => $product->category,
                            'qty_sold' => 0,
                            'revenue' => 0,
                        ];
                    }
                    $productSales[$product->id]['qty_sold'] += $item->quantity;
                    $productSales[$product->id]['revenue'] += $item->subtotal;
                }
            }
        }

        // Sort products by revenue descending
        usort($productSales, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
        $topProducts = array_slice($productSales, 0, 5);

        // Format category breakdown to be list of objects
        $categoryData = [];
        foreach ($categoryBreakdown as $cat => $rev) {
            $categoryData[] = [
                'category' => $cat,
                'revenue' => $rev,
            ];
        }

        // Recent transactions (last 10 completed orders)
        $recentTransactions = $completedOrders->take(10)->map(function ($order) {
            return [
                'id' => $order->id,
                'customer_name' => $order->customer ? $order->customer->fullname : 'Walk-in Customer',
                'items_count' => $order->items->sum('quantity'),
                'total' => $order->total,
                'date' => $order->created_at->toDateString(),
            ];
        });

        return response()->json([
            'summary' => [
                'total_revenue' => $totalRevenue,
                'orders_completed' => $ordersCount,
                'items_sold' => $totalItemsSold,
            ],
            'categories' => $categoryData,
            'top_products' => $topProducts,
            'recent_transactions' => $recentTransactions,
        ]);
    }

    /**
     * Cancel an order by customer.
     */
    public function customerCancel(Request $request, int $id)
    {
        $user = $request->user();
        
        $order = Order::with('items')->where('customer_id', $user->id)->findOrFail($id);
        
        // Check if order status is before "processing"
        if ($order->status !== 'pending' && $order->status !== 'confirmed') {
            return response()->json(['message' => 'Cannot cancel order once it is in processing.'], 400);
        }

        $validator = Validator::make($request->all(), [
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reason = $request->input('reason');

        DB::transaction(function () use ($order, $reason) {
            // Replenish stock
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->increment('stock_' . $item->size, $item->quantity);
                    $product->increment('stock', $item->quantity);
                }
            }

            $order->status = 'cancelled';
            $order->cancel_reason = $reason;
            $order->save();
        });

        ActivityLogService::log(
            "Customer #{$user->id} cancelled order #{$order->id}" . ($reason ? " (Reason: {$reason})" : ""),
            $user->id
        );

        return response()->json(['order' => $order->load(['farm', 'items.product', 'rider'])]);
    }

    /**
     * Confirm receipt of order by customer.
     */
    public function customerReceive(Request $request, int $id)
    {
        $user = $request->user();
        
        $order = Order::where('customer_id', $user->id)->findOrFail($id);

        if ($order->status !== 'completed' && $order->status !== 'ready') {
            return response()->json(['message' => 'Order is not in completed or ready state.'], 400);
        }

        $order->status = 'completed';
        $order->save();

        ActivityLogService::log(
            "Customer #{$user->id} confirmed receipt of order #{$order->id}",
            $user->id
        );

        return response()->json(['order' => $order->load(['farm', 'items.product', 'rider'])]);
    }
}

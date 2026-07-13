<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
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
        $order = Order::with(['farm:id,name,location', 'items.product:id,name,image,category'])
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

                    if ($product->stock < $item['quantity']) {
                        throw new \RuntimeException("Insufficient stock for {$product->name}");
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
}

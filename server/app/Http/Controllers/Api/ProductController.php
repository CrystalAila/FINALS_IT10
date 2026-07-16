<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    /**
     * Get all active products for the customer pov.
     */
    public function index(Request $request)
    {
        $query = Product::query()
            ->with('farm:id,name,location,rating,permit_status,permit_expiry_date')
            ->where('is_active', true)
            ->whereHas('farm', fn ($q) => $q->where('permit_status', 'approved'));

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('farm_origin', 'like', "%{$search}%")
                    ->orWhereHas('farm', fn ($f) => $f->where('name', 'like', "%{$search}%"));
            });
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }

        if ($size = $request->query('size')) {
            $query->where("stock_{$size}", '>', 0);
        }

        if ($farmOrigin = $request->query('farm_origin')) {
            $query->where('farm_origin', 'like', "%{$farmOrigin}%");
        }

        if ($request->query('favorites_only') === 'true' && $user = auth('sanctum')->user()) {
            $favFarmIds = $user->favoriteFarms()->pluck('farms.id');
            $query->whereIn('farm_id', $favFarmIds);
        }

        return response()->json(['products' => $query->latest()->get()]);
    }

    /**
     * Show a single product's details.
     */
    public function show(int $id)
    {
        $product = Product::with('farm:id,name,location,rating,permit_status,permit_expiry_date,description')
            ->where('is_active', true)
            ->whereHas('farm', fn ($q) => $q->where('permit_status', 'approved'))
            ->findOrFail($id);

        return response()->json(['product' => $product]);
    }

    /**
     * Get all products for the seller's farm.
     */
    public function sellerIndex(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['products' => []]);
        }

        $products = Product::where('farm_id', $farm->id)->latest()->get();

        return response()->json(['products' => $products]);
    }

    /**
     * Store a new product listing.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['message' => 'Farm not configured.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:broiler,native,eggs,dressed_chicken'],
            'description' => ['required', 'string'],
            'image' => ['nullable', 'image', 'max:2048'],
            'farm_origin' => ['nullable', 'string', 'max:255'],
            
            // Stock per size
            'stock_small' => ['required', 'integer', 'min:0'],
            'stock_medium' => ['required', 'integer', 'min:0'],
            'stock_large' => ['required', 'integer', 'min:0'],
            'stock_jumbo' => ['required', 'integer', 'min:0'],

            // Price per size
            'price_small' => ['required', 'numeric', 'min:0'],
            'price_medium' => ['required', 'numeric', 'min:0'],
            'price_large' => ['required', 'numeric', 'min:0'],
            'price_jumbo' => ['required', 'numeric', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $imagePath = asset('storage/' . $path);
        } else {
            // Default placeholder image based on category
            $category = $request->input('category');
            if ($category === 'eggs') {
                $imagePath = 'https://images.unsplash.com/photo-1582722879805-a7e02e48a2e8?w=600&h=400&fit=crop';
            } elseif ($category === 'native') {
                $imagePath = 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=600&h=400&fit=crop';
            } elseif ($category === 'dressed_chicken') {
                $imagePath = 'https://images.unsplash.com/photo-1598103442097-8b0287c7d889?w=600&h=400&fit=crop';
            } else {
                $imagePath = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop';
            }
        }

        $totalStock = (int)$request->input('stock_small') +
                      (int)$request->input('stock_medium') +
                      (int)$request->input('stock_large') +
                      (int)$request->input('stock_jumbo');

        $product = Product::create([
            'farm_id' => $farm->id,
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'image' => $imagePath,
            'category' => $request->input('category'),
            'price_small' => $request->input('price_small'),
            'price_medium' => $request->input('price_medium'),
            'price_large' => $request->input('price_large'),
            'price_jumbo' => $request->input('price_jumbo'),
            'stock' => $totalStock,
            'stock_small' => $request->input('stock_small'),
            'stock_medium' => $request->input('stock_medium'),
            'stock_large' => $request->input('stock_large'),
            'stock_jumbo' => $request->input('stock_jumbo'),
            'farm_origin' => $request->input('farm_origin'),
            'rating' => 5.0,
            'is_active' => true,
        ]);

        ActivityLogService::log('Product listing added: ' . $product->name, $user->id);

        return response()->json(['product' => $product], 201);
    }

    /**
     * Update an existing product listing.
     */
    public function update(Request $request, int $id)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['message' => 'Farm not configured.'], 403);
        }

        $product = Product::where('farm_id', $farm->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:broiler,native,eggs,dressed_chicken'],
            'description' => ['required', 'string'],
            'image' => ['nullable', 'image', 'max:2048'],
            'farm_origin' => ['nullable', 'string', 'max:255'],
            'stock_small' => ['required', 'integer', 'min:0'],
            'stock_medium' => ['required', 'integer', 'min:0'],
            'stock_large' => ['required', 'integer', 'min:0'],
            'stock_jumbo' => ['required', 'integer', 'min:0'],
            'price_small' => ['required', 'numeric', 'min:0'],
            'price_medium' => ['required', 'numeric', 'min:0'],
            'price_large' => ['required', 'numeric', 'min:0'],
            'price_jumbo' => ['required', 'numeric', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $product->image = asset('storage/' . $path);
        }

        $totalStock = (int)$request->input('stock_small') +
                      (int)$request->input('stock_medium') +
                      (int)$request->input('stock_large') +
                      (int)$request->input('stock_jumbo');

        $product->update([
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'category' => $request->input('category'),
            'price_small' => $request->input('price_small'),
            'price_medium' => $request->input('price_medium'),
            'price_large' => $request->input('price_large'),
            'price_jumbo' => $request->input('price_jumbo'),
            'stock' => $totalStock,
            'stock_small' => $request->input('stock_small'),
            'stock_medium' => $request->input('stock_medium'),
            'stock_large' => $request->input('stock_large'),
            'stock_jumbo' => $request->input('stock_jumbo'),
            'farm_origin' => $request->input('farm_origin'),
        ]);

        ActivityLogService::log('Product listing updated: ' . $product->name, $user->id);

        return response()->json(['product' => $product]);
    }
}

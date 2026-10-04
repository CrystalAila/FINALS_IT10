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
            ->with('farm:id,name,location,latitude,longitude,full_address,rating,permit_status,permit_expiry_date')
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
        $product = Product::with('farm:id,name,location,latitude,longitude,full_address,rating,permit_status,permit_expiry_date,description')
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

        $category = $request->input('category');
        $isEggs = $category === 'eggs';

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:live_poultry,dressed_meat,eggs,broiler,native,dressed_chicken'],
            'unit_type' => ['nullable', 'string', 'in:per_kilo,per_head,per_tray,per_piece'],
            'increment_step' => ['nullable', 'numeric', 'min:0.01', 'max:100'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:10240'],
            'farm_origin' => ['nullable', 'string', 'max:255'],
        ];

        if ($isEggs) {
            $rules['stock_small'] = ['required', 'integer', 'min:0'];
            $rules['stock_medium'] = ['required', 'integer', 'min:0'];
            $rules['stock_large'] = ['required', 'integer', 'min:0'];
            $rules['stock_jumbo'] = ['required', 'integer', 'min:0'];
            $rules['price_small'] = ['required', 'numeric', 'min:0'];
            $rules['price_medium'] = ['required', 'numeric', 'min:0'];
            $rules['price_large'] = ['required', 'numeric', 'min:0'];
            $rules['price_jumbo'] = ['required', 'numeric', 'min:0'];
        } else {
            $rules['price'] = ['nullable', 'numeric', 'min:0'];
            $rules['stock'] = ['nullable', 'integer', 'min:0'];
            $rules['price_medium'] = ['nullable', 'numeric', 'min:0'];
            $rules['stock_medium'] = ['nullable', 'integer', 'min:0'];
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $unitType = $request->input('unit_type');
        if (!$unitType) {
            if ($category === 'dressed_meat' || $category === 'dressed_chicken') {
                $unitType = 'per_kilo';
            } elseif ($category === 'eggs') {
                $unitType = 'per_tray';
            } else {
                $unitType = 'per_head';
            }
        }
        $incrementStep = $request->input('increment_step');
        if (!$incrementStep) {
            $incrementStep = ($unitType === 'per_kilo') ? 0.50 : 1.00;
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $imagePath = url('storage/' . $path);
        } else {
            // Default placeholder image based on category
            if ($category === 'eggs') {
                $imagePath = 'https://images.unsplash.com/photo-1582722879805-a7e02e48a2e8?w=600&h=400&fit=crop';
            } elseif ($category === 'native') {
                $imagePath = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600&h=400&fit=crop';
            } elseif ($category === 'dressed_chicken' || $category === 'dressed_meat') {
                $imagePath = 'https://images.unsplash.com/photo-1598103442097-8b0287c7d889?w=600&h=400&fit=crop';
            } else {
                $imagePath = 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=400&fit=crop';
            }
        }

        if ($isEggs) {
            $totalStock = (int)$request->input('stock_small') +
                          (int)$request->input('stock_medium') +
                          (int)$request->input('stock_large') +
                          (int)$request->input('stock_jumbo');
            $priceSmall = $request->input('price_small');
            $priceMedium = $request->input('price_medium');
            $priceLarge = $request->input('price_large');
            $priceJumbo = $request->input('price_jumbo');
            $stockSmall = (int)$request->input('stock_small');
            $stockMedium = (int)$request->input('stock_medium');
            $stockLarge = (int)$request->input('stock_large');
            $stockJumbo = (int)$request->input('stock_jumbo');
        } else {
            $singlePrice = $request->input('price') ?? $request->input('price_medium') ?? $request->input('price_small') ?? 0;
            $singleStock = (int)($request->input('stock') ?? $request->input('stock_medium') ?? 0);
            $totalStock = $singleStock;
            $priceSmall = $singlePrice;
            $priceMedium = $singlePrice;
            $priceLarge = $singlePrice;
            $priceJumbo = $singlePrice;
            $stockSmall = 0;
            $stockMedium = $singleStock;
            $stockLarge = 0;
            $stockJumbo = 0;
        }

        $product = Product::create([
            'farm_id' => $farm->id,
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'image' => $imagePath,
            'category' => $category,
            'unit_type' => $unitType,
            'increment_step' => $incrementStep,
            'price_small' => $priceSmall,
            'price_medium' => $priceMedium,
            'price_large' => $priceLarge,
            'price_jumbo' => $priceJumbo,
            'stock' => $totalStock,
            'stock_small' => $stockSmall,
            'stock_medium' => $stockMedium,
            'stock_large' => $stockLarge,
            'stock_jumbo' => $stockJumbo,
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

        $category = $request->input('category') ?? $product->category;
        $isEggs = $category === 'eggs';

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:live_poultry,dressed_meat,eggs,broiler,native,dressed_chicken'],
            'unit_type' => ['nullable', 'string', 'in:per_kilo,per_head,per_tray,per_piece'],
            'increment_step' => ['nullable', 'numeric', 'min:0.01', 'max:100'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:10240'],
            'farm_origin' => ['nullable', 'string', 'max:255'],
        ];

        if ($isEggs) {
            $rules['stock_small'] = ['required', 'integer', 'min:0'];
            $rules['stock_medium'] = ['required', 'integer', 'min:0'];
            $rules['stock_large'] = ['required', 'integer', 'min:0'];
            $rules['stock_jumbo'] = ['required', 'integer', 'min:0'];
            $rules['price_small'] = ['required', 'numeric', 'min:0'];
            $rules['price_medium'] = ['required', 'numeric', 'min:0'];
            $rules['price_large'] = ['required', 'numeric', 'min:0'];
            $rules['price_jumbo'] = ['required', 'numeric', 'min:0'];
        } else {
            $rules['price'] = ['nullable', 'numeric', 'min:0'];
            $rules['stock'] = ['nullable', 'integer', 'min:0'];
            $rules['price_medium'] = ['nullable', 'numeric', 'min:0'];
            $rules['stock_medium'] = ['nullable', 'integer', 'min:0'];
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $unitType = $request->input('unit_type') ?? $product->unit_type;
        if (!$unitType) {
            if ($category === 'dressed_meat' || $category === 'dressed_chicken') {
                $unitType = 'per_kilo';
            } elseif ($category === 'eggs') {
                $unitType = 'per_tray';
            } else {
                $unitType = 'per_head';
            }
        }
        $incrementStep = $request->input('increment_step') ?? $product->increment_step ?? ($unitType === 'per_kilo' ? 0.50 : 1.00);

        if ($isEggs) {
            $totalStock = (int)$request->input('stock_small') +
                          (int)$request->input('stock_medium') +
                          (int)$request->input('stock_large') +
                          (int)$request->input('stock_jumbo');
            $priceSmall = $request->input('price_small');
            $priceMedium = $request->input('price_medium');
            $priceLarge = $request->input('price_large');
            $priceJumbo = $request->input('price_jumbo');
            $stockSmall = (int)$request->input('stock_small');
            $stockMedium = (int)$request->input('stock_medium');
            $stockLarge = (int)$request->input('stock_large');
            $stockJumbo = (int)$request->input('stock_jumbo');
        } else {
            $singlePrice = $request->input('price') ?? $request->input('price_medium') ?? $request->input('price_small') ?? $product->price_medium;
            $singleStock = (int)($request->input('stock') ?? $request->input('stock_medium') ?? $product->stock);
            $totalStock = $singleStock;
            $priceSmall = $singlePrice;
            $priceMedium = $singlePrice;
            $priceLarge = $singlePrice;
            $priceJumbo = $singlePrice;
            $stockSmall = 0;
            $stockMedium = $singleStock;
            $stockLarge = 0;
            $stockJumbo = 0;
        }

        $updateData = [
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'category' => $category,
            'unit_type' => $unitType,
            'increment_step' => $incrementStep,
            'price_small' => $priceSmall,
            'price_medium' => $priceMedium,
            'price_large' => $priceLarge,
            'price_jumbo' => $priceJumbo,
            'stock' => $totalStock,
            'stock_small' => $stockSmall,
            'stock_medium' => $stockMedium,
            'stock_large' => $stockLarge,
            'stock_jumbo' => $stockJumbo,
            'farm_origin' => $request->input('farm_origin'),
        ];

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $updateData['image'] = url('storage/' . $path);
        }

        $product->update($updateData);

        ActivityLogService::log('Product listing updated: ' . $product->name, $user->id);

        return response()->json(['product' => $product]);
    }

    /**
     * Delete a product listing.
     */
    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['message' => 'Farm not configured.'], 403);
        }

        $product = Product::where('farm_id', $farm->id)->findOrFail($id);

        // Remove stored product image if it is stored in public disk
        if ($product->image && str_contains($product->image, '/storage/products/')) {
            $filename = basename(parse_url($product->image, PHP_URL_PATH));
            if ($filename && Storage::disk('public')->exists('products/' . $filename)) {
                Storage::disk('public')->delete('products/' . $filename);
            }
        }

        $productName = $product->name;
        $product->delete();

        ActivityLogService::log('Deleted product listing: ' . $productName, $user->id);

        return response()->json(['message' => 'Product deleted successfully.']);
    }
}

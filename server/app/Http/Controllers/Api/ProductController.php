<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query()
            ->with('farm:id,name,location,rating,permit_status')
            ->where('is_active', true)
            ->whereHas('farm', fn ($q) => $q->where('permit_status', 'approved'));

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhereHas('farm', fn ($f) => $f->where('name', 'like', "%{$search}%"));
            });
        }

        return response()->json(['products' => $query->latest()->get()]);
    }

    public function show(int $id)
    {
        $product = Product::with('farm:id,name,location,rating,permit_status,description')
            ->where('is_active', true)
            ->whereHas('farm', fn ($q) => $q->where('permit_status', 'approved'))
            ->findOrFail($id);

        return response()->json(['product' => $product]);
    }
}

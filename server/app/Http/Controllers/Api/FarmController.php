<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\Product;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class FarmController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            // Create a default farm if it doesn't exist
            $farm = Farm::create([
                'user_id' => $user->id,
                'name' => $user->business_name ?? ($user->fullname . ' Farm'),
                'permit_status' => 'pending',
                'location' => 'Roxas City, Capiz',
                'description' => 'Newly registered local poultry farm.',
                'rating' => 5.0,
            ]);
        }

        return response()->json(['farm' => $farm]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            $farm = new Farm();
            $farm->user_id = $user->id;
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'permit' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'permit_issue_date' => ['required', 'date'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $farm->name = $data['name'];
        $farm->location = $data['location'];
        $farm->description = $data['description'] ?? null;

        if ($request->hasFile('permit')) {
            $permitPath = $request->file('permit')->store('permits', 'public');
            $farm->permit_file = $permitPath;
            // Mark as pending upon new upload
            $farm->permit_status = 'pending';
            $user->status = 'pending';
            $user->save();
        }

        if (!empty($data['permit_issue_date'])) {
            $farm->permit_issue_date = $data['permit_issue_date'];
            // Expiry is 1 year from issue date
            $issueDate = Carbon::parse($data['permit_issue_date']);
            $farm->permit_expiry_date = $issueDate->copy()->addYear()->toDateString();
        }

        // Suspended if permit is expired
        if ($farm->permit_expiry_date && Carbon::parse($farm->permit_expiry_date)->isPast()) {
            $farm->permit_status = 'suspended';
            $user->status = 'suspended';
            $user->save();
        }

        $farm->save();

        ActivityLogService::log("Seller updated shop configuration for {$farm->name}", $user->id);

        return response()->json(['farm' => $farm, 'user' => $user->fresh()]);
    }

    /**
     * Get details of a farm shop, its products, and favorites status.
     */
    public function getFarmDetails(Request $request, int $id)
    {
        $farm = Farm::findOrFail($id);
        
        $isFavorited = false;
        if ($user = auth('sanctum')->user()) {
            $isFavorited = $user->favoriteFarms()->where('farm_id', $farm->id)->exists();
        }

        $products = Product::where('farm_id', $farm->id)
            ->where('is_active', true)
            ->latest()
            ->get();

        return response()->json([
            'farm' => $farm,
            'is_favorited' => $isFavorited,
            'products' => $products,
        ]);
    }

    /**
     * Toggle favorite status of a farm for a customer.
     */
    public function toggleFavorite(Request $request, int $id)
    {
        $user = $request->user();
        $farm = Farm::findOrFail($id);

        if ($user->favoriteFarms()->where('farm_id', $farm->id)->exists()) {
            $user->favoriteFarms()->detach($farm->id);
            $favorited = false;
            $message = "Removed {$farm->name} from favorites.";
        } else {
            $user->favoriteFarms()->attach($farm->id);
            $favorited = true;
            $message = "Added {$farm->name} to favorites.";
        }

        return response()->json([
            'favorited' => $favorited,
            'message' => $message,
        ]);
    }

    /**
     * Get all favorited farms of a customer.
     */
    public function getFavorites(Request $request)
    {
        $user = $request->user();
        $favorites = $user->favoriteFarms()->latest()->get();

        return response()->json([
            'favorites' => $favorites,
        ]);
    }
}

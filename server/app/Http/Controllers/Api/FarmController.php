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
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'full_address' => ['nullable', 'string', 'max:500'],
            'permit' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
            'permit_issue_date' => ['nullable', 'required_with:permit', 'date'],
            'permit_expiry_date' => ['nullable', 'required_with:permit', 'date', 'after_or_equal:permit_issue_date'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $farm->name = $data['name'];
        $farm->location = $data['location'];
        $farm->description = $data['description'] ?? null;
        if (array_key_exists('latitude', $data)) {
            $farm->latitude = $data['latitude'];
        }
        if (array_key_exists('longitude', $data)) {
            $farm->longitude = $data['longitude'];
        }
        if (array_key_exists('full_address', $data)) {
            $farm->full_address = $data['full_address'];
        }

        $permitChanged = $request->hasFile('permit');
        
        $oldIssue = $farm->permit_issue_date ? Carbon::parse($farm->permit_issue_date)->format('Y-m-d') : null;
        $newIssue = !empty($data['permit_issue_date']) ? Carbon::parse($data['permit_issue_date'])->format('Y-m-d') : null;
        $oldExpiry = $farm->permit_expiry_date ? Carbon::parse($farm->permit_expiry_date)->format('Y-m-d') : null;
        $newExpiry = !empty($data['permit_expiry_date']) ? Carbon::parse($data['permit_expiry_date'])->format('Y-m-d') : null;

        $dateChanged = ($newIssue && $oldIssue !== $newIssue) || ($newExpiry && $oldExpiry !== $newExpiry);

        if ($permitChanged) {
            $permitPath = $request->file('permit')->store('permits', 'public');
            $farm->permit_file = $permitPath;
            // Mark as pending upon new upload
            $farm->permit_status = 'pending';
            $user->status = 'pending';
            $user->save();
        }

        if (!empty($data['permit_issue_date'])) {
            $farm->permit_issue_date = $data['permit_issue_date'];
        }

        if (!empty($data['permit_expiry_date'])) {
            $farm->permit_expiry_date = $data['permit_expiry_date'];
        }

        if ($dateChanged && !$permitChanged) {
            // Mark as pending upon date revision/update
            $farm->permit_status = 'pending';
            $user->status = 'pending';
            $user->save();
        }

        // Suspended if permit is expired
        if ($farm->permit_expiry_date && Carbon::parse($farm->permit_expiry_date)->endOfDay()->isPast()) {
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

    /**
     * Get all approved farm shops for customer store finder and nearby discovery.
     */
    public function getShops(Request $request)
    {
        if ($request->has('lat') || $request->has('latitude')) {
            return $this->getNearbyShops($request);
        }

        $shops = Farm::where('permit_status', 'approved')
            ->select('id', 'name', 'location', 'full_address', 'latitude', 'longitude', 'rating', 'logo', 'description')
            ->withCount(['products' => function ($q) {
                $q->where('is_active', true);
            }])
            ->get();

        return response()->json(['shops' => $shops, 'stores' => $shops]);
    }

    /**
     * Get nearby stores within a given radius using the Haversine formula.
     * Accepts: lat, lng, radius (default 10 km).
     */
    public function getNearbyShops(Request $request)
    {
        $lat = $request->query('lat', $request->query('latitude'));
        $lng = $request->query('lng', $request->query('longitude'));
        $radius = (float) $request->query('radius', 10);

        if ($lat === null || $lng === null || $lat === '' || $lng === '') {
            return response()->json([
                'message' => 'Latitude and longitude are required.',
                'stores' => [],
                'shops' => [],
            ], 422);
        }

        $customerLat = (float) $lat;
        $customerLng = (float) $lng;

        // Fetch all sellers that have latitude and longitude saved
        $farms = Farm::whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select('id', 'user_id', 'name', 'location', 'full_address', 'latitude', 'longitude', 'rating', 'logo', 'description', 'permit_status')
            ->withCount(['products' => function ($q) {
                $q->where('is_active', true);
            }])
            ->get();

        // Calculate distance using Haversine formula (Earth radius = 6371 km)
        $earthRadius = 6371;

        $nearby = $farms->map(function ($farm) use ($customerLat, $customerLng, $earthRadius) {
            $farmLat = (float) $farm->latitude;
            $farmLng = (float) $farm->longitude;

            $dLat = deg2rad($farmLat - $customerLat);
            $dLng = deg2rad($farmLng - $customerLng);

            $a = sin($dLat / 2) * sin($dLat / 2) +
                cos(deg2rad($customerLat)) * cos(deg2rad($farmLat)) *
                sin($dLng / 2) * sin($dLng / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $distance = $earthRadius * $c;

            $roundedDistance = round($distance, 2);
            $farm->distance = $roundedDistance;
            $farm->distance_km = $roundedDistance;
            $farm->distance_formatted = $roundedDistance < 1
                ? round($roundedDistance * 1000) . ' m away'
                : $roundedDistance . ' km away';
            $farm->address = $farm->full_address ?: $farm->location;

            return $farm;
        })
        ->filter(function ($farm) use ($radius) {
            return $farm->distance <= $radius;
        })
        ->sortBy('distance')
        ->values();

        return response()->json([
            'stores' => $nearby,
            'shops' => $nearby,
            'count' => $nearby->count(),
            'radius' => $radius,
            'customer_location' => [
                'latitude' => $customerLat,
                'longitude' => $customerLng,
            ],
        ]);
    }
}

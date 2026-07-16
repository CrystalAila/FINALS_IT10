<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class RiderController extends Controller
{
    /**
     * Get all riders for the authenticated seller's farm.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['riders' => []]);
        }

        $riders = Rider::where('farm_id', $farm->id)->latest()->get();

        // Map photo_path to absolute URLs or standard placeholders
        $riders->transform(function ($rider) {
            if ($rider->photo_path) {
                if (filter_var($rider->photo_path, FILTER_VALIDATE_URL)) {
                    $rider->photo_url = $rider->photo_path;
                } else {
                    $rider->photo_url = asset('storage/' . $rider->photo_path);
                }
            } else {
                $rider->photo_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
            }
            return $rider;
        });

        return response()->json(['riders' => $riders]);
    }

    /**
     * Add a new rider to the registry for the seller's farm.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['message' => 'Farm not configured.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'fullname' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'photo' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('riders', 'public');
        }

        $rider = Rider::create([
            'farm_id' => $farm->id,
            'fullname' => $request->input('fullname'),
            'phone' => $request->input('phone'),
            'photo_path' => $photoPath,
        ]);

        // Append photo_url
        if ($photoPath) {
            $rider->photo_url = asset('storage/' . $photoPath);
        } else {
            $rider->photo_url = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80';
        }

        ActivityLogService::log('Rider added to registry: ' . $rider->fullname, $user->id);

        return response()->json(['rider' => $rider], 201);
    }

    /**
     * Remove a rider from the registry.
     */
    public function destroy(Request $request, int $id)
    {
        $user = $request->user();
        $farm = $user->farm;

        if (!$farm) {
            return response()->json(['message' => 'Farm not configured.'], 403);
        }

        $rider = Rider::where('farm_id', $farm->id)->findOrFail($id);

        if ($rider->photo_path) {
            Storage::disk('public')->delete($rider->photo_path);
        }

        $rider->delete();

        ActivityLogService::log('Rider removed from registry: ' . $rider->fullname, $user->id);

        return response()->json(['message' => 'Rider removed from registry.']);
    }
}

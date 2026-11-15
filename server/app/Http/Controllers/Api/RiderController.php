<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RiderController extends Controller
{
    /**
     * Get approved riders on the platform available for deliveries.
     */
    public function index(Request $request)
    {
        $riders = Rider::with('user')
            ->where(function ($q) {
                $q->where('status', 'approved')
                  ->orWhereHas('user', fn ($u) => $u->whereIn('status', ['verified', 'active']));
            })
            ->latest()
            ->get();

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
     * Get the authenticated rider's application profile details.
     */
    public function getApplication(Request $request)
    {
        $user = $request->user();
        $rider = $user->rider;

        if (!$rider) {
            return response()->json(['message' => 'Rider profile not found.'], 404);
        }

        if ($rider->photo_path) {
            $rider->photo_url = filter_var($rider->photo_path, FILTER_VALIDATE_URL) ? $rider->photo_path : asset('storage/' . $rider->photo_path);
        }
        if ($rider->license_photo_path) {
            $rider->license_url = filter_var($rider->license_photo_path, FILTER_VALIDATE_URL) ? $rider->license_photo_path : asset('storage/' . $rider->license_photo_path);
        }

        return response()->json([
            'user' => $user,
            'rider' => $rider,
        ]);
    }

    /**
     * Allow rejected or pending riders to edit and resubmit their registration application.
     * Resets status to 'pending' for administrator review.
     */
    public function updateApplication(Request $request)
    {
        $user = $request->user();
        $rider = $user->rider;

        if (!$rider) {
            return response()->json(['message' => 'Rider profile not found.'], 404);
        }

        // Support alternative field names for files
        if (!$request->hasFile('photo') && $request->hasFile('photo_2x2')) {
            $request->files->set('photo', $request->file('photo_2x2'));
        }
        if (!$request->hasFile('license') && $request->hasFile('license_photo')) {
            $request->files->set('license', $request->file('license_photo'));
        }

        $rules = [
            'fullname' => ['required', 'string', 'max:255', 'regex:/^[\pL\s\.\'\-]+$/u'],
            'phone' => ['required', 'string', 'max:30'],
            'address' => ['required', 'string', 'max:500'],
            'photo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'license' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'plate_number' => ['nullable', 'string', 'max:50'],
            'password' => ['nullable', 'string', 'min:6', 'max:72'],
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->hasFile('photo')) {
            $rider->photo_path = $request->file('photo')->store('riders', 'public');
        }

        if ($request->hasFile('license')) {
            $rider->license_photo_path = $request->file('license')->store('rider_licenses', 'public');
        }

        $rider->fullname = $data['fullname'];
        $rider->phone = $data['phone'];
        $rider->address = $data['address'];
        $rider->vehicle_type = $data['vehicle_type'] ?? $rider->vehicle_type;
        $rider->plate_number = $data['plate_number'] ?? $rider->plate_number;
        $rider->status = 'pending';
        $rider->rejection_reason = null; // Clear rejection reason upon resubmission
        $rider->save();

        $user->fullname = $data['fullname'];
        $user->phone = $data['phone'];
        $user->status = 'pending';
        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        $user->save();

        ActivityLogService::log("Rider {$rider->fullname} edited and resubmitted application for review", $user->id);

        $freshRider = $rider->fresh();
        if ($freshRider->photo_path) {
            $freshRider->photo_url = filter_var($freshRider->photo_path, FILTER_VALIDATE_URL) ? $freshRider->photo_path : asset('storage/' . $freshRider->photo_path);
        }
        if ($freshRider->license_photo_path) {
            $freshRider->license_url = filter_var($freshRider->license_photo_path, FILTER_VALIDATE_URL) ? $freshRider->license_photo_path : asset('storage/' . $freshRider->license_photo_path);
        }

        return response()->json([
            'message' => 'Your rider application has been updated and resubmitted for admin review.',
            'rider' => $freshRider,
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Sellers can no longer add riders directly.
     */
    public function store(Request $request)
    {
        return response()->json([
            'message' => 'Sellers can no longer add or manage riders. Riders must register their own independent account and be approved by an administrator.',
        ], 403);
    }

    /**
     * Sellers can no longer remove riders directly.
     */
    public function destroy(Request $request, int $id)
    {
        return response()->json([
            'message' => 'Sellers can no longer manage or delete riders. Rider accounts are managed independently by platform administrators.',
        ], 403);
    }

    /**
     * Sellers can no longer update riders directly.
     */
    public function update(Request $request, int $id)
    {
        return response()->json([
            'message' => 'Sellers can no longer manage or update riders. Rider accounts are managed independently.',
        ], 403);
    }
}

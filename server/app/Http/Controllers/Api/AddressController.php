<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = Address::where('user_id', $request->user()->id)
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json(['addresses' => $addresses]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:30'],
            'region' => ['required', 'string', 'max:255'],
            'postal_code' => ['required', 'string', 'max:20'],
            'street_address' => ['required', 'string', 'max:500'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $userId = $request->user()->id;
        $makeDefault = $data['is_default'] ?? false;

        $address = DB::transaction(function () use ($userId, $data, $makeDefault) {
            if ($makeDefault || Address::where('user_id', $userId)->count() === 0) {
                Address::where('user_id', $userId)->update(['is_default' => false]);
                $makeDefault = true;
            }

            return Address::create([
                'user_id' => $userId,
                'full_name' => $data['full_name'],
                'phone' => $data['phone'],
                'region' => $data['region'],
                'postal_code' => $data['postal_code'],
                'street_address' => $data['street_address'],
                'is_default' => $makeDefault,
            ]);
        });

        ActivityLogService::log('Address added #' . $address->id, $userId);

        return response()->json(['address' => $address], 201);
    }

    public function update(Request $request, int $id)
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'full_name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:30'],
            'region' => ['sometimes', 'string', 'max:255'],
            'postal_code' => ['sometimes', 'string', 'max:20'],
            'street_address' => ['sometimes', 'string', 'max:500'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        DB::transaction(function () use ($address, $data, $request) {
            if (! empty($data['is_default'])) {
                Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
            }

            $address->update($data);
        });

        ActivityLogService::log('Address updated #' . $address->id, $request->user()->id);

        return response()->json(['address' => $address->fresh()]);
    }

    public function destroy(Request $request, int $id)
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);
        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $next = Address::where('user_id', $request->user()->id)->latest()->first();
            if ($next) {
                $next->update(['is_default' => true]);
            }
        }

        ActivityLogService::log('Address deleted #' . $id, $request->user()->id);

        return response()->json(['message' => 'Address deleted']);
    }

    public function setDefault(Request $request, int $id)
    {
        $address = Address::where('user_id', $request->user()->id)->findOrFail($id);

        DB::transaction(function () use ($address, $request) {
            Address::where('user_id', $request->user()->id)->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        ActivityLogService::log('Default address set #' . $address->id, $request->user()->id);

        return response()->json(['address' => $address->fresh()]);
    }
}

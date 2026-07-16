<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index()
    {
        $users = User::where('role', '!=', 'customer')
            ->with('farm')
            ->orderBy('created_at', 'desc')
            ->get();

        $riders = \App\Models\Rider::with('farm')->get()->map(function ($rider) {
            return [
                'id' => 1000000 + $rider->id,
                'fullname' => $rider->fullname,
                'username' => 'Rider Phone: ' . $rider->phone,
                'role' => 'rider',
                'created_at' => $rider->created_at ? $rider->created_at->toIso8601String() : null,
                'updated_at' => $rider->updated_at ? $rider->updated_at->toIso8601String() : null,
                'is_rider' => true,
                'real_rider_id' => $rider->id,
                'phone' => $rider->phone,
                'farm' => $rider->farm ? [
                    'name' => $rider->farm->name,
                    'location' => $rider->farm->location,
                    'description' => $rider->farm->description,
                ] : null,
            ];
        });

        $combined = $users->map(function ($u) {
            return [
                'id' => $u->id,
                'fullname' => $u->fullname,
                'username' => $u->username,
                'role' => $u->role,
                'created_at' => $u->created_at ? $u->created_at->toIso8601String() : null,
                'updated_at' => $u->updated_at ? $u->updated_at->toIso8601String() : null,
                'is_rider' => false,
                'status' => $u->status,
                'business_name' => $u->business_name,
                'email' => $u->email,
                'phone' => $u->phone,
                'farm' => $u->farm ? [
                    'name' => $u->farm->name,
                    'location' => $u->farm->location,
                    'description' => $u->farm->description,
                    'permit_file' => $u->farm->permit_file,
                    'permit_status' => $u->farm->permit_status,
                    'permit_issue_date' => $u->farm->permit_issue_date,
                    'permit_expiry_date' => $u->farm->permit_expiry_date,
                ] : null,
            ];
        })->concat($riders);

        return response()->json(['users' => $combined]);
    }

    public function show($id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(['user' => $user->only(['id', 'fullname', 'username', 'role', 'created_at', 'updated_at'])]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullname' => ['required', 'string', 'max:255', 'regex:/^[\pL\s\.\'\-]+$/u'],
            'username' => ['required', 'string', 'max:255', 'alpha_num', 'unique:users,username'],
            'password' => ['required', 'string', 'min:6', 'max:72'],
            'role' => ['required', 'in:admin,reseller,customer'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $user = User::create([
            'fullname' => $data['fullname'],
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
        ]);

        ActivityLogService::log("Admin created user {$user->username}");

        return response()->json(['user' => $user->only(['id', 'fullname', 'username', 'role', 'created_at', 'updated_at'])], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'fullname' => ['required', 'string', 'max:255', 'regex:/^[\pL\s\.\'\-]+$/u'],
            'username' => ['required', 'string', 'max:255', 'alpha_num', 'unique:users,username,'.$user->id],
            'password' => ['nullable', 'string', 'min:6', 'max:72'],
            'role' => ['required', 'in:admin,reseller,customer'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $user->fullname = $data['fullname'];
        $user->username = $data['username'];
        $user->role = $data['role'];

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        ActivityLogService::log("Admin updated user {$user->username}");

        return response()->json(['user' => $user->only(['id', 'fullname', 'username', 'role', 'created_at', 'updated_at'])]);
    }

    public function destroy($id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $currentUser = auth()->user();
        if ($currentUser && $currentUser->id === $user->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 403);
        }

        $username = $user->username;
        $user->delete();

        ActivityLogService::log("Admin deleted user {$username}");

        return response()->json(['message' => 'User deleted']);
    }

    public function getPermits(Request $request)
    {
        $status = $request->query('status'); // 'all', 'pending', 'approved', 'rejected', 'suspended', 'under_review'

        $query = User::whereIn('role', ['seller', 'reseller'])->with('farm');

        if ($status && $status !== 'all') {
            if ($status === 'pending') {
                $query->where('status', 'pending');
            } elseif ($status === 'under_review') {
                $query->where('status', 'under_review');
            } elseif ($status === 'approved') {
                $query->where('status', 'verified');
            } elseif ($status === 'suspended') {
                $query->where('status', 'suspended');
            } elseif ($status === 'rejected') {
                $query->where('status', 'rejected');
            }
        }

        $sellers = $query->orderBy('created_at', 'desc')->get();

        $mapped = $sellers->map(function ($seller) {
            $farm = $seller->farm;

            // Auto-suspend expired permits on the fly if checked in UI
            if ($farm && $farm->permit_expiry_date && \Illuminate\Support\Carbon::parse($farm->permit_expiry_date)->isPast() && $seller->status !== 'suspended') {
                $seller->status = 'suspended';
                $seller->save();
                $farm->permit_status = 'suspended';
                $farm->save();
            }

            $uiStatus = 'Pending';
            if ($seller->status === 'under_review') {
                $uiStatus = 'Under Review';
            } elseif ($seller->status === 'verified') {
                $uiStatus = 'Approved';
            } elseif ($seller->status === 'suspended') {
                $uiStatus = 'Suspended';
            } elseif ($seller->status === 'rejected') {
                $uiStatus = 'Rejected';
            }

            $documents = [];
            if ($farm && $farm->permit_file) {
                $documents[] = basename($farm->permit_file);
            }

            return [
                'id' => $seller->id,
                'seller_name' => $seller->business_name ?? ($farm ? $farm->name : $seller->fullname),
                'status' => $uiStatus,
                'documents' => $documents,
                'submitted_at' => $seller->created_at ? $seller->created_at->diffForHumans() : 'unknown',
                'notes' => $farm ? $farm->description : null,
                'permit_url' => $farm && $farm->permit_file ? asset('storage/' . $farm->permit_file) : null,
                'permit_issue_date' => $farm ? $farm->permit_issue_date : null,
                'permit_expiry_date' => $farm ? $farm->permit_expiry_date : null,
            ];
        });

        return response()->json($mapped);
    }

    public function approvePermit($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'verified';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'approved';
            $farm->save();
        }

        ActivityLogService::log("Admin verified seller {$user->username}");
        return response()->json(['message' => 'Seller verified and permit approved']);
    }

    public function rejectPermit($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'rejected';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'rejected';
            $farm->save();
        }

        ActivityLogService::log("Admin rejected permit for seller {$user->username}");
        return response()->json(['message' => 'Seller permit rejected']);
    }

    public function requestRevisionPermit($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'pending';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'pending';
            $farm->save();
        }

        ActivityLogService::log("Admin requested permit revision for seller {$user->username}");
        return response()->json(['message' => 'Permit revision requested']);
    }

    public function suspendSeller($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'suspended';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'rejected';
            $farm->save();
        }

        ActivityLogService::log("Admin suspended seller {$user->username}");
        return response()->json(['message' => 'Seller account suspended']);
    }

    public function underReviewPermit($id)
    {
        $user = User::findOrFail($id);
        $user->status = 'under_review';
        $user->save();

        $farm = $user->farm;
        if ($farm) {
            $farm->permit_status = 'under_review';
            $farm->save();
        }

        ActivityLogService::log("Admin set seller {$user->username} status to Under Review");
        return response()->json(['message' => 'Seller permit is now under review']);
    }
}

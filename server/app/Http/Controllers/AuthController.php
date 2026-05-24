<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullname' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'password' => 'required|string|min:6',
            'role' => 'nullable|in:customer,reseller,admin',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $user = User::create([
            'fullname' => $data['fullname'],
            'username' => $data['username'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'] ?? 'customer',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        ActivityLogService::log('User registered', $user->id);

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('username', $request->input('username'))->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        ActivityLogService::log('User logged in', $user->id);

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $authHeader = $request->header('Authorization');
        if (! $authHeader || ! str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['message' => 'No token provided'], 401);
        }

        $token = substr($authHeader, 7);
        $pat = PersonalAccessToken::findToken($token);

        if (! $pat) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        $user = $pat->tokenable;
        ActivityLogService::log('User logged out', $user->id ?? null);

        $pat->delete();

        return response()->json(['message' => 'Logged out']);
    }

    // Example protected route to get profile via token lookup
    public function profile(Request $request)
    {
        $authHeader = $request->header('Authorization');
        if (! $authHeader || ! str_starts_with($authHeader, 'Bearer ')) {
            return response()->json(['message' => 'No token provided'], 401);
        }

        $token = substr($authHeader, 7);
        $pat = PersonalAccessToken::findToken($token);
        if (! $pat) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        $user = $pat->tokenable;

        return response()->json(['user' => $user]);
    }
}

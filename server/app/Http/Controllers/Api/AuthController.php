<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'fullname' => ['required', 'string', 'max:255', 'regex:/^[\pL\s\.\'\-]+$/u'],
            'username' => ['required', 'string', 'max:255', 'alpha_num', 'unique:users,username'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:6', 'max:72'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $user = User::create([
            'fullname' => $data['fullname'],
            'username' => $data['username'],
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => 'customer',
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        ActivityLogService::log('User registered', $user->id);

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => ['required', 'string', 'alpha_num'],
            'password' => ['required', 'string', 'min:6', 'max:72'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('username', $request->input('username'))->first();

        if (! $user || ! $user->password || ! Hash::check($request->input('password'), $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        ActivityLogService::log('User logged in', $user->id);

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function googleLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'credential' => ['nullable', 'string'],
            'demo' => ['sometimes', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $credential = $request->input('credential');
        $googleId = null;
        $email = null;
        $fullname = null;

        if ($credential) {
            $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $credential,
            ]);

            if (! $response->ok()) {
                return response()->json(['message' => 'Invalid Google credential'], 401);
            }

            $payload = $response->json();
            $clientId = config('services.google.client_id');

            if ($clientId && ($payload['aud'] ?? null) !== $clientId) {
                return response()->json(['message' => 'Google token audience mismatch'], 401);
            }

            $googleId = $payload['sub'] ?? null;
            $email = $payload['email'] ?? null;
            $fullname = $payload['name'] ?? ($payload['given_name'] ?? 'Google User');
        } elseif ($request->boolean('demo')) {
            $googleId = 'demo-google-' . Str::random(8);
            $email = 'demo.google@poultrylink.test';
            $fullname = 'Google Demo User';
        } else {
            return response()->json(['message' => 'Google credential required'], 422);
        }

        if (! $googleId) {
            return response()->json(['message' => 'Unable to verify Google account'], 422);
        }

        $user = User::where('google_id', $googleId)->first();

        if (! $user && $email) {
            $user = User::where('email', $email)->first();
            if ($user) {
                $user->update(['google_id' => $googleId]);
            }
        }

        if (! $user) {
            $baseUsername = 'g' . substr(preg_replace('/[^a-z0-9]/', '', strtolower($googleId)), 0, 12);
            $username = $baseUsername;
            $suffix = 1;

            while (User::where('username', $username)->exists()) {
                $username = $baseUsername . $suffix;
                $suffix++;
            }

            $user = User::create([
                'fullname' => $fullname,
                'username' => $username,
                'email' => $email,
                'google_id' => $googleId,
                'role' => 'customer',
                'password' => null,
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        ActivityLogService::log('User logged in via Google', $user->id);

        return response()->json(['user' => $user, 'token' => $token]);
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => ['required', 'string', 'alpha_num', 'exists:users,username'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('username', $request->input('username'))->first();

        if (! $user || ! $user->password) {
            return response()->json(['message' => 'This account uses Google sign-in. Password reset is not available.'], 422);
        }

        $email = $user->email ?? ($user->username . '@poultrylink.local');
        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => Hash::make($token), 'created_at' => now()],
        );

        ActivityLogService::log('Password reset requested', $user->id);

        return response()->json([
            'message' => 'Password reset link generated.',
            'reset_token' => $token,
            'username' => $user->username,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => ['required', 'string', 'alpha_num', 'exists:users,username'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'max:72', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('username', $request->input('username'))->first();
        $email = $user->email ?? ($user->username . '@poultrylink.local');

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (! $record || ! Hash::check($request->input('token'), $record->token)) {
            return response()->json(['message' => 'Invalid or expired reset token'], 422);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();

            return response()->json(['message' => 'Reset token has expired'], 422);
        }

        $user->update(['password' => Hash::make($request->input('password'))]);
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        ActivityLogService::log('Password reset completed', $user->id);

        return response()->json(['message' => 'Password updated successfully']);
    }

    public function logout(Request $request)
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'No token provided'], 401);
        }

        $pat = PersonalAccessToken::findToken($token);

        if (! $pat) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        $user = $pat->tokenable;
        ActivityLogService::log('User logged out', $user->id ?? null);

        $pat->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function profile(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'fullname' => ['sometimes', 'string', 'max:255', 'regex:/^[\pL\s\.\'\-]+$/u'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'password' => ['sometimes', 'string', 'min:6', 'max:72', 'confirmed'],
            'current_password' => ['required_with:password', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if (isset($data['password'])) {
            if (! $user->password || ! Hash::check($data['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect'], 422);
            }
            $user->password = Hash::make($data['password']);
        }

        $user->fill(collect($data)->only(['fullname', 'email', 'phone'])->toArray());
        $user->save();

        ActivityLogService::log('Profile updated', $user->id);

        return response()->json(['user' => $user->fresh()]);
    }
}

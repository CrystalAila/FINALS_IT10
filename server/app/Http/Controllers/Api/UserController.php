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
        $users = User::orderBy('created_at', 'desc')
            ->get(['id', 'fullname', 'username', 'role', 'created_at', 'updated_at']);

        return response()->json(['users' => $users]);
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
}

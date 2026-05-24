<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class LogController extends Controller
{
    public function index(Request $request)
    {
        $query = \App\Models\Log::with('user')->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('activity', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('username', 'like', "%{$search}%")
                        ->orWhere('fullname', 'like', "%{$search}%");
                  });
        }

        $logs = $query->paginate(50);

        return response()->json($logs);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'activity' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = Auth::user();
        ActivityLogService::log($request->input('activity'), $user->id ?? null);

        return response()->json(['message' => 'Activity logged']);
    }
}

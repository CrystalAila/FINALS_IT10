<?php

namespace App\Services;

use App\Models\Log;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    public static function log(string $activity, ?int $userId = null): Log
    {
        $userId = $userId ?? Auth::id();
        if (!$userId) {
            $userId = \App\Models\User::where('role', 'admin')->value('id') ?? 1;
        }

        return Log::create([
            'user_id' => $userId,
            'activity' => $activity,
        ]);
    }
}

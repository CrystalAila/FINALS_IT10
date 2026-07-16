<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Accepts one or more roles as separate middleware arguments:
     *   ->middleware(\App\Http\Middleware\RoleMiddleware::class . ':seller,reseller')
     *   OR multiple args: handle($request, $next, 'seller', 'reseller')
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user() ?? auth()->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (in_array($user->role, ['seller', 'reseller']) && $user->status !== 'verified') {
            return response()->json(['message' => 'Your seller account is not verified yet.'], 403);
        }

        if (! empty($roles)) {
            // Support both comma-separated single arg and multiple args
            $allowed = [];
            foreach ($roles as $r) {
                foreach (array_map('trim', explode(',', $r)) as $role) {
                    $allowed[] = $role;
                }
            }

            if (! in_array($user->role, $allowed)) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        }

        return $next($request);
    }
}

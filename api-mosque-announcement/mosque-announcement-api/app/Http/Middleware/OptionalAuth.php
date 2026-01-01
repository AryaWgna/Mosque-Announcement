<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class OptionalAuth
{
    /**
     * Handle an incoming request.
     * 
     * This middleware attempts to authenticate the user if a Bearer token is provided,
     * but allows the request to proceed even if no token is present or invalid.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Try to authenticate if Authorization header is present
        if ($request->bearerToken()) {
            try {
                // Attempt to authenticate using Sanctum
                $user = Auth::guard('sanctum')->user();
                if ($user) {
                    Auth::setUser($user);
                }
            } catch (\Exception $e) {
                // Silently fail - continue as guest
            }
        }

        return $next($request);
    }
}

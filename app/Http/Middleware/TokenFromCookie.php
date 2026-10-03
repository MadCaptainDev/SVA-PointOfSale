<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * File downloads opened with window.open() can't send an Authorization header,
 * but the browser does send the SPA's `authToken` cookie. Use it as the bearer
 * token so download routes can stay behind auth:sanctum.
 */
class TokenFromCookie
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->cookies->get('authToken');

        if (! $request->bearerToken() && is_string($token) && $token !== '') {
            $request->headers->set('Authorization', 'Bearer '.$token);
        }

        return $next($request);
    }
}

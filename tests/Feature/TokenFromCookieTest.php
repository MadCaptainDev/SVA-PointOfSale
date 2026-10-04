<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class TokenFromCookieTest extends TestCase
{
    /**
     * A download opened from the POS page (same-site Referer) goes through
     * Sanctum's stateful middleware, which decrypts cookies. The plain
     * authToken cookie must survive that so auth:sanctum can use it.
     */
    public function test_auth_token_cookie_reaches_bearer_header_on_stateful_request(): void
    {
        Route::middleware(['api', 'token.cookie'])->get('/api/_token-cookie-probe', function (Request $request) {
            return response()->json(['bearer' => $request->bearerToken()]);
        });

        $response = $this->withUnencryptedCookie('authToken', '5|abc')
            ->withHeader('Referer', config('app.url').'/#/app/purchases')
            ->get('/api/_token-cookie-probe');

        $this->assertSame('5|abc', $response->json('bearer'));
    }
}

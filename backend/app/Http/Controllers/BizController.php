<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;

class BizController extends Controller
{
    public function connect()
    {
        $url      = rtrim(config('services.biz.url'), '/') . '/api/auth/login';
        $email    = config('services.biz.email');
        $password = config('services.biz.password');

        if (!$email || !$password) {
            return response()->json(['message' => 'BIZ credentials not configured'], 503);
        }

        $response = Http::post($url, compact('email', 'password'));

        if (!$response->successful()) {
            return response()->json(['message' => 'soymatt-platform unavailable'], 503);
        }

        return response()->json($response->json());
    }
}

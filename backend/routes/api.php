<?php
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BizController;
use App\Http\Controllers\InfraController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn($req) => $req->user());

    // soymatt-platform auto-connect
    Route::get('/biz/connect', [BizController::class, 'connect']);

    // Mission Control
    Route::prefix('infra')->group(function () {
        Route::get('/docker',     [InfraController::class, 'docker']);
        Route::get('/github',     [InfraController::class, 'github']);
        Route::get('/cloudflare', [InfraController::class, 'cloudflare']);
        Route::get('/hestia',     [InfraController::class, 'hestia']);
        Route::get('/vps',        [InfraController::class, 'vpsStats']);
        Route::get('/feed',       [InfraController::class, 'feed']);
        Route::post('/docker/{name}/restart', [InfraController::class, 'restartContainer']);
        Route::get('/docker/{name}/logs',     [InfraController::class, 'containerLogs']);
    });
});

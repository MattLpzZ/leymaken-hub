<?php
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BizController;
use App\Http\Controllers\InfraController;
use App\Http\Controllers\SecretsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn($req) => $req->user());

    // soymatt-platform auto-connect
    Route::get('/biz/connect', [BizController::class, 'connect']);

    // API Key management
    Route::get('/secrets',          [SecretsController::class, 'index']);
    Route::put('/secrets/{key}',    [SecretsController::class, 'upsert']);
    Route::delete('/secrets/{key}', [SecretsController::class, 'destroy']);

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

    // Settings
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::patch('/settings', [SettingsController::class, 'update']);
    Route::post('/settings/test-email', [SettingsController::class, 'testEmail']);

    // Users
    Route::apiResource('users', UsersController::class);

    // Activity
    Route::get('/activity/stream', [ActivityController::class, 'stream']);
    Route::get('/activity/recent', [ActivityController::class, 'recent']);
    Route::post('/activity', [ActivityController::class, 'store']);
});

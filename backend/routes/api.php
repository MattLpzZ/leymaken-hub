<?php
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ApiKeyController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BizController;
use App\Http\Controllers\InfraController;
use App\Http\Controllers\SaasCompanyController;
use App\Http\Controllers\SaasPlanController;
use App\Http\Controllers\SecretsController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SuiteController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::get('/activity/stream', [ActivityController::class, 'stream']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
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
    Route::get('/activity/recent', [ActivityController::class, 'recent']);
    Route::post('/activity', [ActivityController::class, 'store']);

    // Leymaken Suite
    Route::prefix('suite')->group(function () {
        // Companies
        Route::get('companies', [SaasCompanyController::class, 'index']);
        Route::post('companies', [SaasCompanyController::class, 'store']);
        Route::put('companies/{id}', [SaasCompanyController::class, 'update']);
        Route::patch('companies/{id}/suspend', [SaasCompanyController::class, 'suspend']);
        Route::patch('companies/{id}/activate', [SaasCompanyController::class, 'activate']);
        Route::delete('companies/{id}', [SaasCompanyController::class, 'destroy']);
        Route::get('companies/{id}/users', [SaasCompanyController::class, 'users']);
        Route::patch('companies/{id}/users/{uid}/reset-password', [SaasCompanyController::class, 'resetPassword']);

        // Plans
        Route::get('plans', [SaasPlanController::class, 'index']);
        Route::post('plans', [SaasPlanController::class, 'store']);
        Route::put('plans/{id}', [SaasPlanController::class, 'update']);
        Route::delete('plans/{id}', [SaasPlanController::class, 'destroy']);

        // Suites catalog
        Route::get('suites', [SuiteController::class, 'index']);
        Route::post('suites', [SuiteController::class, 'store']);
        Route::put('suites/{id}', [SuiteController::class, 'update']);
        Route::delete('suites/{id}', [SuiteController::class, 'destroy']);
        Route::get('companies/{id}/suites', [SuiteController::class, 'companySuites']);
        Route::patch('companies/{id}/suites', [SuiteController::class, 'updateCompanySuites']);

        // API Keys
        Route::get('companies/{companyId}/api-keys', [ApiKeyController::class, 'index']);
        Route::post('companies/{companyId}/api-keys', [ApiKeyController::class, 'store']);
        Route::patch('companies/{companyId}/api-keys/{keyId}', [ApiKeyController::class, 'update']);
        Route::delete('companies/{companyId}/api-keys/{keyId}', [ApiKeyController::class, 'destroy']);
    });
});

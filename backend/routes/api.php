<?php
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\ApiKeyController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BizController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InfraController;
use App\Http\Controllers\InvoiceCategoryController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\QuoteController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\SaasCompanyController;
use App\Http\Controllers\SaasPlanController;
use App\Http\Controllers\ScheduledController;
use App\Http\Controllers\SecretsController;
use App\Http\Controllers\ServiceItemController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SuiteController;
use App\Http\Controllers\TransactionController;
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
    Route::get('/settings/test-n8n', [SettingsController::class, 'testN8n']);
    Route::post('/settings/test-telegram', [SettingsController::class, 'testTelegram']);

    // Users
    Route::apiResource('users', UsersController::class);

    // Clients (client-centric model)
    Route::apiResource('clients', ClientController::class);
    Route::post('clients/{client}/services',            [ClientController::class, 'addService']);
    Route::patch('clients/{client}/services/{service}', [ClientController::class, 'updateService']);
    Route::delete('clients/{client}/services/{service}',[ClientController::class, 'removeService']);

    // Invoices
    Route::get('/invoices',              [InvoiceController::class, 'index']);
    Route::post('/invoices',             [InvoiceController::class, 'store']);
    Route::get('/invoices/{invoice}',    [InvoiceController::class, 'show']);
    Route::put('/invoices/{invoice}',    [InvoiceController::class, 'update']);
    Route::patch('/invoices/{invoice}/mark-paid', [InvoiceController::class, 'markPaid']);
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);

    // Quotes
    Route::get('/quotes',             [QuoteController::class, 'index']);
    Route::post('/quotes',            [QuoteController::class, 'store']);
    Route::get('/quotes/{quote}',     [QuoteController::class, 'show']);
    Route::put('/quotes/{quote}',     [QuoteController::class, 'update']);
    Route::post('/quotes/{quote}/convert', [QuoteController::class, 'convert']);
    Route::delete('/quotes/{quote}',  [QuoteController::class, 'destroy']);

    // Dashboard stats
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Reminders (Agenda)
    Route::get('/reminders',                     [ReminderController::class, 'index']);
    Route::post('/reminders',                    [ReminderController::class, 'store']);
    Route::put('/reminders/{reminder}',          [ReminderController::class, 'update']);
    Route::patch('/reminders/{reminder}/complete',[ReminderController::class, 'complete']);
    Route::patch('/reminders/{reminder}/dismiss', [ReminderController::class, 'dismiss']);
    Route::delete('/reminders/{reminder}',       [ReminderController::class, 'destroy']);

    // Projects
    Route::get('/projects',                [ProjectController::class, 'index']);
    Route::post('/projects',               [ProjectController::class, 'store']);
    Route::put('/projects/{project}',      [ProjectController::class, 'update']);
    Route::delete('/projects/{project}',   [ProjectController::class, 'destroy']);
    Route::post('/projects/{project}/tasks',      [ProjectController::class, 'createTask']);
    Route::patch('/tasks/{task}/status',          [ProjectController::class, 'updateTaskStatus']);
    Route::delete('/tasks/{task}',                [ProjectController::class, 'deleteTask']);
    Route::get('/time-entries',                   [ProjectController::class, 'timeEntries']);
    Route::post('/time-entries',                  [ProjectController::class, 'createTimeEntry']);
    Route::post('/time-entries/stop',             [ProjectController::class, 'stopTimeEntry']);
    Route::delete('/time-entries/{entry}',        [ProjectController::class, 'deleteTimeEntry']);

    // Transactions (Caja)
    Route::get('/transactions',               [TransactionController::class, 'index']);
    Route::post('/transactions',              [TransactionController::class, 'store']);
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{transaction}',[TransactionController::class, 'destroy']);
    Route::get('/transactions/summary/monthly',[TransactionController::class, 'monthlySummary']);

    // Scheduled transactions (Finance)
    Route::get('/scheduled-transactions',                          [ScheduledController::class, 'index']);
    Route::post('/scheduled-transactions',                         [ScheduledController::class, 'store']);
    Route::put('/scheduled-transactions/{scheduled}',              [ScheduledController::class, 'update']);
    Route::patch('/scheduled-transactions/{scheduled}/toggle',     [ScheduledController::class, 'toggle']);
    Route::post('/scheduled-transactions/{scheduled}/execute',     [ScheduledController::class, 'execute']);
    Route::delete('/scheduled-transactions/{scheduled}',           [ScheduledController::class, 'destroy']);

    // Billing categories
    Route::get('/invoice-categories',                       [InvoiceCategoryController::class, 'index']);
    Route::post('/invoice-categories',                      [InvoiceCategoryController::class, 'store']);
    Route::put('/invoice-categories/{invoiceCategory}',     [InvoiceCategoryController::class, 'update']);
    Route::delete('/invoice-categories/{invoiceCategory}',  [InvoiceCategoryController::class, 'destroy']);

    // Service items (catalog)
    Route::get('/service-items',                [ServiceItemController::class, 'index']);
    Route::post('/service-items',               [ServiceItemController::class, 'store']);
    Route::put('/service-items/{serviceItem}',  [ServiceItemController::class, 'update']);
    Route::delete('/service-items/{serviceItem}',[ServiceItemController::class, 'destroy']);

    // AI Assistant
    Route::post('/ai/chat', [AiController::class, 'chat']);
    Route::get('/ai/status', [AiController::class, 'status']);

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

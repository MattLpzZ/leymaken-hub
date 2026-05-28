<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $activeClients = Client::where('status', 'active')->count();

        $mrr = ClientService::where('status', 'active')->sum('monthly_value');

        $invoicedMonth = Invoice::whereYear('issue_date', now()->year)
            ->whereMonth('issue_date', now()->month)
            ->sum('total');

        $saasClients = \App\Models\SaasCompany::where('status', 'active')->count();

        return response()->json([
            'agency_clients' => $activeClients,
            'mrr'            => (float) $mrr,
            'cmm_clients'    => 0,
            'pending_posts'  => 0,
            'agents_active'  => 0,
            'pending_queue'  => 0,
            'saas_clients'   => $saasClients,
            'invoiced_month' => (float) $invoicedMonth,
        ]);
    }
}

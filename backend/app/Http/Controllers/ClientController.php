<?php
namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ClientService;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    public function index(): array
    {
        return Client::with('services')->orderBy('name')->get()->toArray();
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'nullable|email|max:255',
            'phone'        => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'rnc'          => 'nullable|string|max:50',
            'address'      => 'nullable|string',
            'notes'        => 'nullable|string',
            'status'       => 'nullable|in:prospect,active,inactive',
        ]);

        $client = Client::create($data);
        ActivityLog::write("Cliente creado: {$client->name}", 'info', 'clients');
        return response()->json($client->load('services'), 201);
    }

    public function show(Client $client): Client
    {
        return $client->load('services');
    }

    public function update(Request $request, Client $client): Client
    {
        $data = $request->validate([
            'name'         => 'sometimes|required|string|max:255',
            'email'        => 'nullable|email|max:255',
            'phone'        => 'nullable|string|max:50',
            'company_name' => 'nullable|string|max:255',
            'rnc'          => 'nullable|string|max:50',
            'address'      => 'nullable|string',
            'notes'        => 'nullable|string',
            'status'       => 'nullable|in:prospect,active,inactive',
        ]);

        $client->update($data);
        return $client->load('services');
    }

    public function destroy(Client $client): JsonResponse
    {
        $name = $client->name;
        $client->delete();
        ActivityLog::write("Cliente eliminado: {$name}", 'warning', 'clients');
        return response()->json(['ok' => true]);
    }

    public function addService(Request $request, Client $client): JsonResponse
    {
        $data = $request->validate([
            'type'          => 'required|in:suite,automation,project,ubicado',
            'name'          => 'required|string|max:255',
            'status'        => 'nullable|in:pending,active,paused,cancelled',
            'monthly_value' => 'nullable|numeric|min:0',
            'start_date'    => 'nullable|date',
            'notes'         => 'nullable|string',
            'meta'          => 'nullable|array',
        ]);

        $service = $client->services()->create($data);
        return response()->json($service, 201);
    }

    public function updateService(Request $request, Client $client, int $service): ClientService
    {
        $svc = $client->services()->findOrFail($service);
        $svc->update($request->only([
            'type', 'name', 'status', 'monthly_value', 'start_date', 'notes', 'meta',
        ]));
        return $svc;
    }

    public function removeService(Client $client, int $service): JsonResponse
    {
        $client->services()->findOrFail($service)->delete();
        return response()->json(['ok' => true]);
    }

    public function generateInvoice(Request $request, Client $client): JsonResponse
    {
        $services = $client->services()->where('status', 'active')->get();

        if ($services->isEmpty()) {
            return response()->json(['error' => 'El cliente no tiene servicios activos'], 422);
        }

        $month      = now()->format('m');
        $year       = now()->format('Y');
        $number     = 'INV-' . $year . $month . '-' . strtoupper(Str::random(4));
        $issueDate  = now()->toDateString();
        $dueDate    = now()->addDays(15)->toDateString();

        $items    = $services->map(fn($s) => [
            'description' => $s->name,
            'qty'         => 1,
            'unit_price'  => $s->monthly_value,
            'total'       => $s->monthly_value,
        ]);
        $subtotal = $items->sum('total');

        $invoice = Invoice::create([
            'client_id'    => $client->id,
            'number'       => $number,
            'status'       => 'draft',
            'issue_date'   => $issueDate,
            'due_date'     => $dueDate,
            'currency'     => 'DOP',
            'subtotal'     => $subtotal,
            'tax'          => 0,
            'total'        => $subtotal,
            'public_token' => Str::random(32),
            'notes'        => "Servicios del mes {$month}/{$year}",
        ]);

        foreach ($items as $item) {
            $invoice->items()->create($item);
        }

        ActivityLog::write("Factura #{$number} generada automáticamente para {$client->name}", 'billing');

        return response()->json($invoice->load(['client', 'items']), 201);
    }
}

<?php
namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ClientService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
}

<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Models\SaasCompany;
use Illuminate\Http\Request;

class ApiKeyController extends Controller
{
    public function index($companyId)
    {
        $company = SaasCompany::findOrFail($companyId);

        return response()->json(
            ApiKey::where('company_id', $company->id)
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function store(Request $request, $companyId)
    {
        $company = SaasCompany::findOrFail($companyId);

        $data = $request->validate([
            'label'       => 'required|string|max:150',
            'environment' => 'nullable|in:production,sandbox',
            'notes'       => 'nullable|string',
        ]);

        $generated = ApiKey::generate();

        $apiKey = ApiKey::create([
            'company_id'   => $company->id,
            'label'        => $data['label'],
            'key_hash'     => $generated['hash'],
            'key_prefix'   => $generated['prefix'],
            'key_display'  => $generated['display'],
            'environment'  => $data['environment'] ?? 'production',
            'notes'        => $data['notes'] ?? null,
            'active'       => true,
            'kill_switch'  => false,
        ]);

        return response()->json(array_merge($apiKey->toArray(), [
            'plain_key' => $generated['plain'],
            '_notice'   => 'Guarda esta clave. No se mostrará de nuevo.',
        ]), 201);
    }

    public function update(Request $request, $companyId, $keyId)
    {
        $company = SaasCompany::findOrFail($companyId);
        $apiKey  = ApiKey::where('company_id', $company->id)->findOrFail($keyId);

        $data = $request->validate([
            'label'       => 'sometimes|string|max:150',
            'active'      => 'sometimes|boolean',
            'kill_switch' => 'sometimes|boolean',
            'notes'       => 'nullable|string',
            'environment' => 'sometimes|in:production,sandbox',
        ]);

        $apiKey->update($data);
        return response()->json($apiKey);
    }

    public function destroy($companyId, $keyId)
    {
        $company = SaasCompany::findOrFail($companyId);
        $apiKey  = ApiKey::where('company_id', $company->id)->findOrFail($keyId);

        $apiKey->delete();
        return response()->json(null, 204);
    }
}

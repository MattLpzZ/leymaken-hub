<?php

namespace App\Http\Controllers;

use App\Models\SaasCompany;
use App\Models\SaasSuite;
use Illuminate\Http\Request;

class SuiteController extends Controller
{
    public function index()
    {
        return response()->json(
            SaasSuite::orderBy('label')->get()->map(fn($s) => [
                'id'      => $s->id,
                'key'     => $s->key,
                'label'   => $s->label,
                'icon'    => $s->icon,
                'modules' => $s->modules ?? [],
                'active'  => $s->active,
            ])
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'key'             => 'required|string|max:50|unique:saas_suites,key|regex:/^[a-z0-9_-]+$/',
            'label'           => 'required|string|max:150',
            'icon'            => 'nullable|string|max:50',
            'modules'         => 'nullable|array',
            'modules.*.key'   => 'required|string|max:50',
            'modules.*.label' => 'required|string|max:150',
        ]);

        return response()->json(SaasSuite::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $suite = SaasSuite::findOrFail($id);

        $data = $request->validate([
            'label'           => 'sometimes|string|max:150',
            'icon'            => 'nullable|string|max:50',
            'modules'         => 'nullable|array',
            'modules.*.key'   => 'required|string|max:50',
            'modules.*.label' => 'required|string|max:150',
            'active'          => 'sometimes|boolean',
        ]);

        $suite->update($data);
        return response()->json($suite);
    }

    public function destroy($id)
    {
        $suite = SaasSuite::findOrFail($id);
        $suite->delete();
        return response()->json(null, 204);
    }

    public function companySuites($id)
    {
        $company = SaasCompany::findOrFail($id);

        return response()->json([
            'active_suites' => $company->active_suites ?? [],
        ]);
    }

    public function updateCompanySuites(Request $request, $id)
    {
        $company   = SaasCompany::findOrFail($id);
        $validKeys = SaasSuite::pluck('key')->toArray();

        $data = $request->validate([
            'active_suites'   => 'required|array',
            'active_suites.*' => 'string|in:' . implode(',', $validKeys),
        ]);

        $company->update(['active_suites' => $data['active_suites']]);

        return response()->json([
            'active_suites' => $company->active_suites,
        ]);
    }
}

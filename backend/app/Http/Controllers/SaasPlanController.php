<?php

namespace App\Http\Controllers;

use App\Models\SaasPlan;
use Illuminate\Http\Request;

class SaasPlanController extends Controller
{
    public function index()
    {
        return response()->json(
            SaasPlan::withCount('companies')->orderBy('price')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'price'       => 'required|numeric|min:0',
            'cycle'       => 'required|in:monthly,annual',
            'max_users'   => 'required|integer|min:1',
            'description' => 'nullable|string',
            'modules'     => 'nullable|array',
            'active'      => 'boolean',
        ]);

        return response()->json(SaasPlan::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $plan = SaasPlan::findOrFail($id);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'price'       => 'sometimes|numeric|min:0',
            'cycle'       => 'sometimes|in:monthly,annual',
            'max_users'   => 'sometimes|integer|min:1',
            'description' => 'nullable|string',
            'modules'     => 'nullable|array',
            'active'      => 'boolean',
        ]);

        $plan->update($data);

        return response()->json($plan->loadCount('companies'));
    }

    public function destroy($id)
    {
        $plan = SaasPlan::withCount('companies')->findOrFail($id);

        if ($plan->companies_count > 0) {
            return response()->json([
                'message' => 'No se puede eliminar un plan con empresas activas.',
            ], 422);
        }

        $plan->delete();
        return response()->json(null, 204);
    }
}

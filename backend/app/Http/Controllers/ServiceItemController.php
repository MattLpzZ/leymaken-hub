<?php

namespace App\Http\Controllers;

use App\Models\ServiceItem;
use Illuminate\Http\Request;

class ServiceItemController extends Controller
{
    public function index()
    {
        return response()->json(ServiceItem::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'category'    => 'nullable|string|max:100',
            'price'       => 'nullable|numeric|min:0',
            'unit'        => 'nullable|string|max:30',
            'description' => 'nullable|string',
        ]);
        return response()->json(ServiceItem::create($data), 201);
    }

    public function update(Request $request, ServiceItem $serviceItem)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'category'    => 'nullable|string|max:100',
            'price'       => 'nullable|numeric|min:0',
            'unit'        => 'nullable|string|max:30',
            'description' => 'nullable|string',
            'active'      => 'sometimes|boolean',
        ]);
        $serviceItem->update($data);
        return response()->json($serviceItem);
    }

    public function destroy(ServiceItem $serviceItem)
    {
        $serviceItem->delete();
        return response()->json(null, 204);
    }
}

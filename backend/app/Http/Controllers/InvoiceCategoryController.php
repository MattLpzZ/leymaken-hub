<?php

namespace App\Http\Controllers;

use App\Models\InvoiceCategory;
use Illuminate\Http\Request;

class InvoiceCategoryController extends Controller
{
    public function index()
    {
        return response()->json(InvoiceCategory::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'color'       => 'nullable|string|max:30',
            'description' => 'nullable|string',
        ]);
        return response()->json(InvoiceCategory::create($data), 201);
    }

    public function update(Request $request, InvoiceCategory $invoiceCategory)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'color'       => 'nullable|string|max:30',
            'description' => 'nullable|string',
        ]);
        $invoiceCategory->update($data);
        return response()->json($invoiceCategory);
    }

    public function destroy(InvoiceCategory $invoiceCategory)
    {
        $invoiceCategory->delete();
        return response()->json(null, 204);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $q = Invoice::with(['client', 'items'])->latest();

        if ($request->filled('client_id')) {
            $q->where('client_id', $request->client_id);
        }
        if ($request->filled('status')) {
            $q->where('status', $request->status);
        }

        return response()->json($q->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'client_id'  => 'required|exists:clients,id',
            'number'     => 'required|string|max:30|unique:invoices,number',
            'status'     => 'in:draft,pending,paid,overdue,cancelled',
            'issue_date' => 'required|date',
            'due_date'   => 'nullable|date',
            'currency'   => 'string|size:3',
            'notes'      => 'nullable|string',
            'items'      => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.qty'         => 'required|numeric|min:0',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $items     = collect($data['items'])->map(fn($i) => array_merge($i, ['total' => $i['qty'] * $i['unit_price']]));
        $subtotal  = $items->sum('total');
        $tax       = $data['tax'] ?? 0;

        $invoice = Invoice::create(array_merge(
            $data,
            [
                'subtotal'     => $subtotal,
                'tax'          => $tax,
                'total'        => $subtotal + $tax,
                'public_token' => Str::random(32),
                'items'        => null,
            ]
        ));

        foreach ($items as $item) {
            $invoice->items()->create($item);
        }

        ActivityLog::write("Factura #{$invoice->number} creada", 'billing');

        return response()->json($invoice->load(['client', 'items']), 201);
    }

    public function show(Invoice $invoice)
    {
        return response()->json($invoice->load(['client', 'items']));
    }

    public function update(Request $request, Invoice $invoice)
    {
        $data = $request->validate([
            'client_id'  => 'sometimes|exists:clients,id',
            'number'     => "sometimes|string|max:30|unique:invoices,number,{$invoice->id}",
            'status'     => 'sometimes|in:draft,pending,paid,overdue,cancelled',
            'issue_date' => 'sometimes|date',
            'due_date'   => 'nullable|date',
            'paid_at'    => 'nullable|date',
            'currency'   => 'sometimes|string|size:3',
            'notes'      => 'nullable|string',
            'items'      => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string',
            'items.*.qty'         => 'required_with:items|numeric|min:0',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
        ]);

        if (isset($data['items'])) {
            $items    = collect($data['items'])->map(fn($i) => array_merge($i, ['total' => $i['qty'] * $i['unit_price']]));
            $subtotal = $items->sum('total');
            $tax      = $data['tax'] ?? $invoice->tax;

            $invoice->items()->delete();
            foreach ($items as $item) {
                $invoice->items()->create($item);
            }

            $data = array_merge($data, ['subtotal' => $subtotal, 'tax' => $tax, 'total' => $subtotal + $tax]);
            unset($data['items']);
        }

        $invoice->update($data);
        return response()->json($invoice->load(['client', 'items']));
    }

    public function markPaid(Invoice $invoice)
    {
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);
        ActivityLog::write("Factura #{$invoice->number} marcada como pagada", 'billing');
        return response()->json($invoice->load(['client', 'items']));
    }

    public function destroy(Invoice $invoice)
    {
        $number = $invoice->number;
        $invoice->delete();
        ActivityLog::write("Factura #{$number} eliminada", 'billing');
        return response()->json(null, 204);
    }
}

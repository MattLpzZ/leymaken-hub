<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Quote;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $q = Quote::with(['client', 'items'])->latest();

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
            'client_id'    => 'required|exists:clients,id',
            'number'       => 'required|string|max:30|unique:quotes,number',
            'status'       => 'in:pending,approved,rejected,expired',
            'issue_date'   => 'required|date',
            'expires_date' => 'nullable|date',
            'currency'     => 'string|size:3',
            'notes'        => 'nullable|string',
            'items'        => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.qty'         => 'required|numeric|min:0',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $items    = collect($data['items'])->map(fn($i) => array_merge($i, ['total' => $i['qty'] * $i['unit_price']]));
        $subtotal = $items->sum('total');
        $tax      = $data['tax'] ?? 0;

        $quote = Quote::create(array_merge(
            $data,
            ['subtotal' => $subtotal, 'tax' => $tax, 'total' => $subtotal + $tax, 'items' => null]
        ));

        foreach ($items as $item) {
            $quote->items()->create($item);
        }

        ActivityLog::write("Cotización #{$quote->number} creada", 'billing');

        return response()->json($quote->load(['client', 'items']), 201);
    }

    public function show(Quote $quote)
    {
        return response()->json($quote->load(['client', 'items']));
    }

    public function update(Request $request, Quote $quote)
    {
        $data = $request->validate([
            'client_id'    => 'sometimes|exists:clients,id',
            'number'       => "sometimes|string|max:30|unique:quotes,number,{$quote->id}",
            'status'       => 'sometimes|in:pending,approved,rejected,expired',
            'issue_date'   => 'sometimes|date',
            'expires_date' => 'nullable|date',
            'currency'     => 'sometimes|string|size:3',
            'notes'        => 'nullable|string',
            'items'        => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string',
            'items.*.qty'         => 'required_with:items|numeric|min:0',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
        ]);

        if (isset($data['items'])) {
            $items    = collect($data['items'])->map(fn($i) => array_merge($i, ['total' => $i['qty'] * $i['unit_price']]));
            $subtotal = $items->sum('total');
            $tax      = $data['tax'] ?? $quote->tax;

            $quote->items()->delete();
            foreach ($items as $item) {
                $quote->items()->create($item);
            }

            $data = array_merge($data, ['subtotal' => $subtotal, 'tax' => $tax, 'total' => $subtotal + $tax]);
            unset($data['items']);
        }

        $quote->update($data);
        return response()->json($quote->load(['client', 'items']));
    }

    public function convert(Quote $quote)
    {
        $invoice = Invoice::create([
            'client_id'    => $quote->client_id,
            'number'       => 'INV-' . Str::upper(Str::random(6)),
            'status'       => 'pending',
            'issue_date'   => now(),
            'subtotal'     => $quote->subtotal,
            'tax'          => $quote->tax,
            'total'        => $quote->total,
            'currency'     => $quote->currency,
            'notes'        => $quote->notes,
            'public_token' => Str::random(32),
        ]);

        foreach ($quote->items as $item) {
            InvoiceItem::create([
                'invoice_id'  => $invoice->id,
                'description' => $item->description,
                'qty'         => $item->qty,
                'unit_price'  => $item->unit_price,
                'total'       => $item->total,
            ]);
        }

        $quote->update(['status' => 'approved', 'converted_invoice_id' => $invoice->id]);
        ActivityLog::write("Cotización #{$quote->number} convertida a factura #{$invoice->number}", 'billing');

        return response()->json([
            'quote'   => $quote->load(['client', 'items']),
            'invoice' => $invoice->load(['client', 'items']),
        ]);
    }

    public function destroy(Quote $quote)
    {
        $number = $quote->number;
        $quote->delete();
        ActivityLog::write("Cotización #{$number} eliminada", 'billing');
        return response()->json(null, 204);
    }
}

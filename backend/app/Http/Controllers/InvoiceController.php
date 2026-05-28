<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\HubSetting;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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

    public function sendEmail(Invoice $invoice)
    {
        $invoice->load(['client', 'items']);

        if (!$invoice->client?->email) {
            return response()->json(['error' => 'El cliente no tiene email registrado'], 422);
        }

        $settings = HubSetting::pluck('value', 'key');
        $from     = $settings->get('mail_from_address', config('mail.from.address'));
        $fromName = $settings->get('mail_from_name', config('mail.from.name'));

        Mail::send([], [], function ($m) use ($invoice, $from, $fromName): void {
            $client   = $invoice->client;
            $itemRows = $invoice->items->map(fn($i) =>
                "<tr><td style='padding:4px 8px'>{$i->description}</td><td style='padding:4px 8px;text-align:right'>{$i->qty}</td><td style='padding:4px 8px;text-align:right'>RD$ " . number_format($i->unit_price, 2) . "</td><td style='padding:4px 8px;text-align:right'>RD$ " . number_format($i->total, 2) . "</td></tr>"
            )->implode('');

            $html = "
                <h2>Factura #{$invoice->number}</h2>
                <p>Estimado/a {$client->name},</p>
                <p>Adjuntamos el detalle de su factura correspondiente al período.</p>
                <table border='1' cellspacing='0' style='border-collapse:collapse;width:100%'>
                  <thead><tr style='background:#f5f5f5'>
                    <th style='padding:4px 8px;text-align:left'>Descripción</th>
                    <th style='padding:4px 8px;text-align:right'>Cant.</th>
                    <th style='padding:4px 8px;text-align:right'>Precio Unit.</th>
                    <th style='padding:4px 8px;text-align:right'>Total</th>
                  </tr></thead>
                  <tbody>{$itemRows}</tbody>
                  <tfoot><tr>
                    <td colspan='3' style='padding:4px 8px;text-align:right'><strong>Total:</strong></td>
                    <td style='padding:4px 8px;text-align:right'><strong>RD$ " . number_format($invoice->total, 2) . "</strong></td>
                  </tr></tfoot>
                </table>
                " . ($invoice->notes ? "<p><em>{$invoice->notes}</em></p>" : '') . "
                <p>Gracias por su confianza.</p>";

            $m->from($from ?? config('mail.from.address'), $fromName ?? config('mail.from.name'))
              ->to($invoice->client->email, $invoice->client->name)
              ->subject("Factura #{$invoice->number}")
              ->html($html);
        });

        if ($invoice->status === 'draft') {
            $invoice->update(['status' => 'pending']);
        }

        ActivityLog::write("Factura #{$invoice->number} enviada por email a {$invoice->client->email}", 'billing');
        return response()->json(['sent' => true]);
    }

    public function printView(Invoice $invoice)
    {
        $invoice->load(['client', 'items']);
        $client   = $invoice->client;
        $itemRows = $invoice->items->map(fn($i) =>
            "<tr>
              <td style='padding:6px 8px;border-bottom:1px solid #eee'>{$i->description}</td>
              <td style='padding:6px 8px;border-bottom:1px solid #eee;text-align:center'>{$i->qty}</td>
              <td style='padding:6px 8px;border-bottom:1px solid #eee;text-align:right'>RD$ " . number_format($i->unit_price, 2) . "</td>
              <td style='padding:6px 8px;border-bottom:1px solid #eee;text-align:right'>RD$ " . number_format($i->total, 2) . "</td>
            </tr>"
        )->implode('');

        $html = "<!DOCTYPE html><html><head><meta charset='utf-8'>
        <title>Factura #{$invoice->number}</title>
        <style>body{font-family:sans-serif;font-size:13px;color:#111;padding:32px}
        h1{font-size:20px;margin-bottom:4px} table{width:100%;border-collapse:collapse}
        th{background:#f3f4f6;padding:6px 8px;text-align:left;font-size:12px}
        @media print{button{display:none}}</style>
        </head><body>
        <div style='display:flex;justify-content:space-between;margin-bottom:24px'>
          <div><h1>FACTURA</h1><p style='color:#666'>#{$invoice->number}</p></div>
          <div style='text-align:right'>
            <p style='margin:0'><strong>Fecha:</strong> {$invoice->issue_date}</p>
            " . ($invoice->due_date ? "<p style='margin:0'><strong>Vence:</strong> {$invoice->due_date}</p>" : '') . "
          </div>
        </div>
        <div style='margin-bottom:20px'>
          <p style='margin:0'><strong>Cliente:</strong> {$client->name}</p>
          " . ($client->company_name ? "<p style='margin:0'>{$client->company_name}</p>" : '') . "
          " . ($client->rnc ? "<p style='margin:0'>RNC: {$client->rnc}</p>" : '') . "
          " . ($client->email ? "<p style='margin:0'>{$client->email}</p>" : '') . "
        </div>
        <table>
          <thead><tr>
            <th>Descripción</th>
            <th style='text-align:center'>Cant.</th>
            <th style='text-align:right'>Precio Unit.</th>
            <th style='text-align:right'>Total</th>
          </tr></thead>
          <tbody>{$itemRows}</tbody>
          <tfoot>
            " . ($invoice->tax > 0 ? "<tr><td colspan='3' style='text-align:right;padding:6px 8px'>Subtotal:</td><td style='text-align:right;padding:6px 8px'>RD$ " . number_format($invoice->subtotal, 2) . "</td></tr>
            <tr><td colspan='3' style='text-align:right;padding:6px 8px'>ITBIS:</td><td style='text-align:right;padding:6px 8px'>RD$ " . number_format($invoice->tax, 2) . "</td></tr>" : '') . "
            <tr><td colspan='3' style='text-align:right;padding:8px;font-weight:bold;font-size:14px'>TOTAL:</td>
            <td style='text-align:right;padding:8px;font-weight:bold;font-size:14px'>RD$ " . number_format($invoice->total, 2) . "</td></tr>
          </tfoot>
        </table>
        " . ($invoice->notes ? "<p style='margin-top:20px;color:#666;font-style:italic'>{$invoice->notes}</p>" : '') . "
        <script>window.onload=function(){window.print()}</script>
        </body></html>";

        return response($html, 200)->header('Content-Type', 'text/html');
    }
}

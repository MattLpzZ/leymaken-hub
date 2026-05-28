<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $q = Transaction::with('client')->orderBy('date', 'desc');
        if ($request->filled('type'))     $q->where('type', $request->type);
        if ($request->filled('category')) $q->where('category', $request->category);
        if ($request->filled('month'))    $q->whereMonth('date', $request->month);
        if ($request->filled('year'))     $q->whereYear('date', $request->year);
        return response()->json($q->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type'        => 'required|in:income,expense',
            'description' => 'required|string|max:255',
            'amount'      => 'required|numeric|min:0',
            'category'    => 'nullable|string|max:100',
            'date'        => 'required|date',
            'client_id'   => 'nullable|exists:clients,id',
            'account'     => 'nullable|string|max:50',
            'reference'   => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
        ]);
        return response()->json(Transaction::create($data)->load('client'), 201);
    }

    public function update(Request $request, Transaction $transaction)
    {
        $data = $request->validate([
            'type'        => 'sometimes|in:income,expense',
            'description' => 'sometimes|string|max:255',
            'amount'      => 'sometimes|numeric|min:0',
            'category'    => 'nullable|string|max:100',
            'date'        => 'sometimes|date',
            'client_id'   => 'nullable|exists:clients,id',
            'account'     => 'nullable|string|max:50',
            'reference'   => 'nullable|string|max:100',
            'notes'       => 'nullable|string',
        ]);
        $transaction->update($data);
        return response()->json($transaction->load('client'));
    }

    public function destroy(Transaction $transaction)
    {
        $transaction->delete();
        return response()->json(null, 204);
    }

    public function monthlySummary(Request $request)
    {
        $year = $request->input('year', now()->year);

        $rows = Transaction::selectRaw('MONTH(date) as month, type, SUM(amount) as total')
            ->whereYear('date', $year)
            ->groupBy('month', 'type')
            ->get();

        $summary = [];
        for ($m = 1; $m <= 12; $m++) {
            $income  = $rows->where('month', $m)->where('type', 'income')->sum('total');
            $expense = $rows->where('month', $m)->where('type', 'expense')->sum('total');
            $summary[] = [
                'month'   => $m,
                'income'  => (float) $income,
                'expense' => (float) $expense,
                'balance' => (float) ($income - $expense),
            ];
        }

        return response()->json($summary);
    }
}

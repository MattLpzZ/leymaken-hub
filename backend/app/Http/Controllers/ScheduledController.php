<?php

namespace App\Http\Controllers;

use App\Models\ScheduledTransaction;
use App\Models\Transaction;
use Illuminate\Http\Request;

class ScheduledController extends Controller
{
    public function index()
    {
        return response()->json(ScheduledTransaction::orderBy('next_date')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'description'  => 'required|string|max:255',
            'category'     => 'nullable|string|max:100',
            'amount'       => 'required|numeric|min:0',
            'type'         => 'required|in:income,expense',
            'account'      => 'in:personal,brand',
            'frequency'    => 'required|in:weekly,biweekly,monthly,yearly',
            'next_date'    => 'required|date',
            'day_of_month' => 'nullable|integer|min:1|max:31',
            'active'       => 'boolean',
        ]);
        return response()->json(ScheduledTransaction::create($data), 201);
    }

    public function update(Request $request, ScheduledTransaction $scheduled)
    {
        $data = $request->validate([
            'description'  => 'sometimes|string|max:255',
            'category'     => 'nullable|string|max:100',
            'amount'       => 'sometimes|numeric|min:0',
            'type'         => 'sometimes|in:income,expense',
            'account'      => 'sometimes|in:personal,brand',
            'frequency'    => 'sometimes|in:weekly,biweekly,monthly,yearly',
            'next_date'    => 'sometimes|date',
            'day_of_month' => 'nullable|integer|min:1|max:31',
            'active'       => 'sometimes|boolean',
        ]);
        $scheduled->update($data);
        return response()->json($scheduled);
    }

    public function toggle(ScheduledTransaction $scheduled)
    {
        $scheduled->update(['active' => !$scheduled->active]);
        return response()->json($scheduled);
    }

    public function execute(ScheduledTransaction $scheduled)
    {
        Transaction::create([
            'type'        => $scheduled->type,
            'description' => $scheduled->description,
            'amount'      => $scheduled->amount,
            'category'    => $scheduled->category,
            'date'        => now()->toDateString(),
            'account'     => $scheduled->account,
        ]);

        $next = match ($scheduled->frequency) {
            'weekly'    => now()->addWeek(),
            'biweekly'  => now()->addWeeks(2),
            'monthly'   => now()->addMonth(),
            'yearly'    => now()->addYear(),
            default     => now()->addMonth(),
        };

        $scheduled->update(['next_date' => $next->toDateString()]);
        return response()->json($scheduled);
    }

    public function destroy(ScheduledTransaction $scheduled)
    {
        $scheduled->delete();
        return response()->json(null, 204);
    }
}

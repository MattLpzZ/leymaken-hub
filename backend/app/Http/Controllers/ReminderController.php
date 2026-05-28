<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index()
    {
        return response()->json(Reminder::orderBy('due_date')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'type'        => 'nullable|string|max:50',
            'related_to'  => 'nullable|string|max:100',
            'module'      => 'nullable|string|max:50',
            'due_date'    => 'nullable|date',
            'status'      => 'in:pendiente,completado,descartado',
        ]);
        return response()->json(Reminder::create($data), 201);
    }

    public function update(Request $request, Reminder $reminder)
    {
        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type'        => 'nullable|string|max:50',
            'related_to'  => 'nullable|string|max:100',
            'module'      => 'nullable|string|max:50',
            'due_date'    => 'nullable|date',
            'status'      => 'sometimes|in:pendiente,completado,descartado',
        ]);
        $reminder->update($data);
        return response()->json($reminder);
    }

    public function complete(Reminder $reminder)
    {
        $reminder->update(['status' => 'completado']);
        return response()->json($reminder);
    }

    public function dismiss(Reminder $reminder)
    {
        $reminder->update(['status' => 'descartado']);
        return response()->json($reminder);
    }

    public function destroy(Reminder $reminder)
    {
        $reminder->delete();
        return response()->json(null, 204);
    }
}

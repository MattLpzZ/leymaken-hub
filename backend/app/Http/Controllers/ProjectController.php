<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\HubProject;
use App\Models\ProjectTask;
use App\Models\TimeEntry;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        return response()->json(HubProject::with(['client', 'tasks'])->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'client_id'   => 'nullable|exists:clients,id',
            'status'      => 'in:active,paused,completed,cancelled',
            'budget'      => 'nullable|numeric|min:0',
            'deadline'    => 'nullable|date',
            'description' => 'nullable|string',
        ]);
        $project = HubProject::create($data);
        ActivityLog::write("Proyecto '{$project->name}' creado", 'projects');
        return response()->json($project->load(['client', 'tasks']), 201);
    }

    public function update(Request $request, HubProject $project)
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'client_id'   => 'nullable|exists:clients,id',
            'status'      => 'sometimes|in:active,paused,completed,cancelled',
            'budget'      => 'nullable|numeric|min:0',
            'deadline'    => 'nullable|date',
            'description' => 'nullable|string',
        ]);
        $project->update($data);
        return response()->json($project->load(['client', 'tasks']));
    }

    public function destroy(HubProject $project)
    {
        $project->delete();
        return response()->json(null, 204);
    }

    public function createTask(Request $request, HubProject $project)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'in:todo,doing,done',
            'order'       => 'nullable|integer|min:0',
        ]);
        $task = $project->tasks()->create($data);
        return response()->json($task, 201);
    }

    public function updateTaskStatus(Request $request, ProjectTask $task)
    {
        $data = $request->validate(['status' => 'required|in:todo,doing,done']);
        $task->update($data);
        return response()->json($task);
    }

    public function deleteTask(ProjectTask $task)
    {
        $task->delete();
        return response()->json(null, 204);
    }

    // Time entries
    public function timeEntries(Request $request)
    {
        $q = TimeEntry::with('project')->latest();
        if ($request->filled('project_id')) $q->where('project_id', $request->project_id);
        if ($request->filled('billable'))   $q->where('billable', $request->boolean('billable'));
        return response()->json($q->get());
    }

    public function createTimeEntry(Request $request)
    {
        $data = $request->validate([
            'project_id'  => 'nullable|exists:projects,id',
            'description' => 'required|string',
            'hours'       => 'nullable|numeric|min:0',
            'date'        => 'required|date',
            'billable'    => 'boolean',
            'hourly_rate' => 'nullable|numeric|min:0',
            'started_at'  => 'nullable|date',
            'stopped_at'  => 'nullable|date',
        ]);
        $entry = TimeEntry::create($data);
        return response()->json($entry->load('project'), 201);
    }

    public function stopTimeEntry(Request $request)
    {
        $data = $request->validate([
            'project_id'  => 'nullable|exists:projects,id',
            'description' => 'required|string',
            'started_at'  => 'required|date',
            'billable'    => 'boolean',
            'hourly_rate' => 'nullable|numeric',
        ]);
        $started = \Carbon\Carbon::parse($data['started_at']);
        $stopped = now();
        $hours   = round($stopped->diffInMinutes($started) / 60, 2);

        $entry = TimeEntry::create(array_merge($data, [
            'stopped_at' => $stopped,
            'hours'      => $hours,
            'date'       => $stopped->toDateString(),
        ]));
        return response()->json($entry->load('project'), 201);
    }

    public function deleteTimeEntry(TimeEntry $entry)
    {
        $entry->delete();
        return response()->json(null, 204);
    }
}

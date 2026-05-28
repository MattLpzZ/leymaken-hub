<?php
namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityController extends Controller
{
    public function stream(): StreamedResponse
    {
        return response()->stream(function () {
            $lastId = 0;
            $attempts = 0;
            while ($attempts < 60) { // max 60s connection
                $logs = ActivityLog::where('id', '>', $lastId)
                    ->orderBy('id')
                    ->limit(10)
                    ->get();

                foreach ($logs as $log) {
                    $data = json_encode([
                        'id'      => $log->id,
                        'level'   => $log->level,
                        'module'  => $log->module,
                        'message' => $log->message,
                        'time'    => $log->created_at->format('H:i:s'),
                    ]);
                    echo "data: {$data}\n\n";
                    $lastId = $log->id;
                }

                ob_flush();
                flush();
                sleep(2);
                $attempts++;
            }
        }, 200, [
            'Content-Type'      => 'text/event-stream',
            'Cache-Control'     => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection'        => 'keep-alive',
        ]);
    }

    public function recent()
    {
        return ActivityLog::orderByDesc('id')->limit(50)->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'message' => 'required|string',
            'level'   => 'sometimes|in:info,warning,error,success',
            'module'  => 'sometimes|string',
        ]);
        ActivityLog::write(
            $data['message'],
            $data['level'] ?? 'info',
            $data['module'] ?? 'system'
        );
        return ['ok' => true];
    }
}

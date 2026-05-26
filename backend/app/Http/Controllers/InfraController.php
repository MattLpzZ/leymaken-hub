<?php
namespace App\Http\Controllers;

use App\Services\DockerService;
use App\Services\GitHubService;
use App\Services\CloudflareService;
use App\Models\InfraSnapshot;
use Illuminate\Http\JsonResponse;

class InfraController extends Controller
{
    public function __construct(
        private DockerService     $docker,
        private GitHubService     $github,
        private CloudflareService $cloudflare,
    ) {}

    public function docker(): JsonResponse
    {
        $containers = $this->docker->listContainers();
        return response()->json(['containers' => $containers, 'polled_at' => now()->toISOString()]);
    }

    public function github(): JsonResponse
    {
        $repos = $this->github->listRepos();
        $repos = array_map(function ($repo) {
            [$owner, $name] = explode('/', $repo['full_name']);
            $repo['latest_commit'] = $this->github->getLatestCommit($owner, $name, $repo['default_branch']);
            return $repo;
        }, array_slice($repos, 0, 10));

        return response()->json(['repos' => $repos, 'polled_at' => now()->toISOString()]);
    }

    public function cloudflare(): JsonResponse
    {
        $accountId = config('services.cloudflare.account_id');
        $zones     = $this->cloudflare->listZones();
        $zones     = array_map(function ($zone) {
            $zone['analytics'] = $this->cloudflare->getZoneAnalytics($zone['id']);
            return $zone;
        }, $zones);
        $workers = $this->cloudflare->listWorkers($accountId);

        return response()->json(['zones' => $zones, 'workers' => $workers, 'polled_at' => now()->toISOString()]);
    }

    public function feed(): JsonResponse
    {
        $events = [];
        foreach (['docker', 'github', 'cloudflare'] as $source) {
            $snap = InfraSnapshot::where('source', $source)->latest('polled_at')->first();
            if (!$snap) continue;
            $count = match($source) {
                'docker'     => count($snap->data['containers'] ?? []) . ' containers',
                'github'     => count($snap->data['repos'] ?? []) . ' repos',
                'cloudflare' => count($snap->data['zones'] ?? []) . ' zones, ' . count($snap->data['workers'] ?? []) . ' workers',
            };
            $events[] = [
                'source'    => $source,
                'message'   => "Polled {$source}: {$count}",
                'timestamp' => $snap->polled_at->toISOString(),
            ];
        }

        return response()->json(['events' => $events]);
    }

    public function restartContainer(string $name): JsonResponse
    {
        $ok = $this->docker->restart($name);
        return response()->json(['ok' => $ok], $ok ? 200 : 500);
    }

    public function containerLogs(string $name): JsonResponse
    {
        $lines = request()->integer('lines', 100);
        $logs  = $this->docker->getLogs($name, $lines);
        return response()->json(['logs' => $logs]);
    }
}

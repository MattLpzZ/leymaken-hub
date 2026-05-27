<?php
namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class DockerService
{
    private Client $client;

    public function __construct(?Client $client = null)
    {
        $this->client = $client ?? new Client([
            'base_uri' => 'http://localhost',
            'curl'     => [CURLOPT_UNIX_SOCKET_PATH => '/var/run/docker.sock'],
            'timeout'  => 5,
        ]);
    }

    public function listContainers(): array
    {
        try {
            $res  = $this->client->get('/v1.44/containers/json?all=true');
            $raw  = json_decode($res->getBody()->getContents(), true);
            return array_map(fn($c) => [
                'id'     => substr($c['Id'], 0, 12),
                'name'   => ltrim($c['Names'][0] ?? 'unknown', '/'),
                'state'  => $c['State'],
                'status' => $c['Status'],
            ], $raw ?? []);
        } catch (GuzzleException) {
            return [];
        }
    }

    public function getLogs(string $name, int $lines = 100): string
    {
        try {
            $res = $this->client->get("/v1.44/containers/{$name}/logs?stdout=true&stderr=true&tail={$lines}");
            return $res->getBody()->getContents();
        } catch (GuzzleException) {
            return '';
        }
    }

    public function restart(string $name): bool
    {
        try {
            $res = $this->client->post("/v1.44/containers/{$name}/restart");
            return $res->getStatusCode() === 204;
        } catch (GuzzleException) {
            return false;
        }
    }

    public function getStats(string $name): array
    {
        try {
            $res  = $this->client->get("/v1.44/containers/{$name}/stats?stream=false");
            $data = json_decode($res->getBody()->getContents(), true);

            $cpuDelta  = $data['cpu_stats']['cpu_usage']['total_usage'] - $data['precpu_stats']['cpu_usage']['total_usage'];
            $sysDelta  = $data['cpu_stats']['system_cpu_usage'] - $data['precpu_stats']['system_cpu_usage'];
            $numCPUs   = $data['cpu_stats']['online_cpus'] ?? 1;
            $cpuPct    = $sysDelta > 0 ? round(($cpuDelta / $sysDelta) * $numCPUs * 100, 1) : 0;

            $memUsage  = $data['memory_stats']['usage'] ?? 0;
            $memLimit  = $data['memory_stats']['limit'] ?? 1;
            $memPct    = round($memUsage / $memLimit * 100, 1);

            return ['cpu_pct' => $cpuPct, 'mem_pct' => $memPct, 'mem_mb' => round($memUsage / 1024 / 1024, 1)];
        } catch (GuzzleException) {
            return ['cpu_pct' => 0, 'mem_pct' => 0, 'mem_mb' => 0];
        }
    }
}

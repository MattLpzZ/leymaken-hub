<?php
namespace App\Jobs;

use App\Models\InfraSnapshot;
use App\Services\DockerService;
use App\Services\GitHubService;
use App\Services\CloudflareService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class PollInfraJob implements ShouldQueue
{
    use Queueable;

    public function handle(DockerService $docker, GitHubService $github, CloudflareService $cloudflare): void
    {
        $sources = [
            'docker'     => fn() => ['containers' => $docker->listContainers()],
            'github'     => fn() => ['repos' => $github->listRepos()],
            'cloudflare' => fn() => ['zones' => $cloudflare->listZones(), 'workers' => $cloudflare->listWorkers(config('services.cloudflare.account_id'))],
        ];

        foreach ($sources as $source => $fetch) {
            InfraSnapshot::create([
                'source'    => $source,
                'data'      => $fetch(),
                'polled_at' => now(),
            ]);
        }

        InfraSnapshot::where('polled_at', '<', now()->subDay())->delete();
    }
}

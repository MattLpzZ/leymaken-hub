<?php
namespace App\Services;

use App\Models\HubSetting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class GitHubService
{
    private Client $client;

    public function __construct(?Client $client = null)
    {
        $token = HubSetting::getValue('GITHUB_TOKEN') ?? config('services.github.token');
        $this->client = $client ?? new Client([
            'base_uri' => 'https://api.github.com/',
            'headers'  => [
                'Authorization' => "Bearer {$token}",
                'Accept'        => 'application/vnd.github+json',
                'X-GitHub-Api-Version' => '2022-11-28',
            ],
            'timeout' => 10,
        ]);
    }

    public function listRepos(): array
    {
        try {
            $res  = $this->client->get('user/repos?sort=updated&per_page=20&type=owner');
            $raw  = json_decode($res->getBody()->getContents(), true);
            return array_map(fn($r) => [
                'name'           => $r['name'],
                'full_name'      => $r['full_name'],
                'default_branch' => $r['default_branch'],
                'updated_at'     => $r['updated_at'],
                'html_url'       => $r['html_url'],
            ], $raw ?? []);
        } catch (GuzzleException) {
            return [];
        }
    }

    public function getLatestCommit(string $owner, string $repo, string $branch): array
    {
        try {
            $res    = $this->client->get("repos/{$owner}/{$repo}/commits?sha={$branch}&per_page=1");
            $raw    = json_decode($res->getBody()->getContents(), true);
            $commit = $raw[0] ?? null;
            if (!$commit) return [];
            return [
                'sha'     => substr($commit['sha'], 0, 7),
                'message' => explode("\n", $commit['commit']['message'])[0],
                'author'  => $commit['commit']['author']['name'],
                'date'    => $commit['commit']['author']['date'],
                'url'     => $commit['html_url'],
            ];
        } catch (GuzzleException) {
            return [];
        }
    }
}

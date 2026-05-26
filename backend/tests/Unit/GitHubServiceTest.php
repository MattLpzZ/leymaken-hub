<?php
namespace Tests\Unit;

use App\Services\GitHubService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class GitHubServiceTest extends TestCase
{
    private function makeService(array $responses): GitHubService
    {
        $mock    = new MockHandler($responses);
        $handler = HandlerStack::create($mock);
        $client  = new Client(['handler' => $handler]);
        return new GitHubService($client);
    }

    public function test_list_repos_returns_formatted_array(): void
    {
        $reposJson = json_encode([[
            'name'           => 'leymaken-hub',
            'full_name'      => 'MattLpzZ/leymaken-hub',
            'default_branch' => 'main',
            'updated_at'     => '2026-05-26T10:00:00Z',
            'html_url'       => 'https://github.com/MattLpzZ/leymaken-hub',
        ]]);

        $service = $this->makeService([new Response(200, [], $reposJson)]);
        $repos   = $service->listRepos();

        $this->assertCount(1, $repos);
        $this->assertEquals('leymaken-hub', $repos[0]['name']);
        $this->assertEquals('main', $repos[0]['default_branch']);
    }

    public function test_get_latest_commit_returns_formatted_data(): void
    {
        $commitJson = json_encode([[
            'sha'    => 'abc1234567890',
            'commit' => [
                'message'   => 'feat: add mission control',
                'author'    => ['name' => 'Matt', 'date' => '2026-05-26T10:00:00Z'],
            ],
            'html_url' => 'https://github.com/MattLpzZ/leymaken-hub/commit/abc123',
        ]]);

        $service = $this->makeService([new Response(200, [], $commitJson)]);
        $commit  = $service->getLatestCommit('MattLpzZ', 'leymaken-hub', 'main');

        $this->assertEquals('abc1234', $commit['sha']);
        $this->assertEquals('feat: add mission control', $commit['message']);
        $this->assertEquals('Matt', $commit['author']);
    }
}

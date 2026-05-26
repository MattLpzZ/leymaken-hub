<?php
namespace Tests\Feature;

use App\Models\User;
use App\Services\DockerService;
use App\Services\GitHubService;
use App\Services\CloudflareService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InfraControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_docker_endpoint_requires_auth(): void
    {
        $res = $this->getJson('/api/infra/docker');
        $res->assertStatus(401);
    }

    public function test_docker_endpoint_returns_containers(): void
    {
        $this->mock(DockerService::class, function ($mock) {
            $mock->shouldReceive('listContainers')->once()->andReturn([
                ['id' => 'abc123', 'name' => 'leymaken_api', 'state' => 'running', 'status' => 'Up 2h'],
            ]);
        });

        $res = $this->actingAs($this->user)->getJson('/api/infra/docker');
        $res->assertOk()->assertJsonPath('containers.0.name', 'leymaken_api');
    }

    public function test_github_endpoint_returns_repos(): void
    {
        $this->mock(GitHubService::class, function ($mock) {
            $mock->shouldReceive('listRepos')->once()->andReturn([
                ['name' => 'leymaken-hub', 'full_name' => 'MattLpzZ/leymaken-hub', 'default_branch' => 'main', 'updated_at' => '2026-05-26', 'html_url' => 'https://github.com/MattLpzZ/leymaken-hub'],
            ]);
            $mock->shouldReceive('getLatestCommit')->once()->andReturn([
                'sha' => 'abc1234', 'message' => 'feat: init', 'author' => 'Matt', 'date' => '2026-05-26T10:00:00Z', 'url' => '#',
            ]);
        });

        $res = $this->actingAs($this->user)->getJson('/api/infra/github');
        $res->assertOk()->assertJsonPath('repos.0.name', 'leymaken-hub');
    }

    public function test_restart_container_endpoint(): void
    {
        $this->mock(DockerService::class, function ($mock) {
            $mock->shouldReceive('restart')->with('leymaken_api')->once()->andReturn(true);
        });

        $res = $this->actingAs($this->user)->postJson('/api/infra/docker/leymaken_api/restart');
        $res->assertOk()->assertJson(['ok' => true]);
    }
}

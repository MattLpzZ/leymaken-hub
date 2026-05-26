<?php
namespace Tests\Unit;

use App\Services\DockerService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class DockerServiceTest extends TestCase
{
    private function makeService(array $responses): DockerService
    {
        $mock    = new MockHandler($responses);
        $handler = HandlerStack::create($mock);
        $client  = new Client(['handler' => $handler]);
        return new DockerService($client);
    }

    public function test_list_containers_returns_formatted_array(): void
    {
        $dockerResponse = json_encode([[
            'Id'     => 'abc123',
            'Names'  => ['/leymaken_api'],
            'State'  => 'running',
            'Status' => 'Up 2 hours',
        ]]);

        $service    = $this->makeService([new Response(200, [], $dockerResponse)]);
        $containers = $service->listContainers();

        $this->assertCount(1, $containers);
        $this->assertEquals('leymaken_api', $containers[0]['name']);
        $this->assertEquals('running', $containers[0]['state']);
        $this->assertEquals('Up 2 hours', $containers[0]['status']);
    }

    public function test_get_logs_returns_string(): void
    {
        $service = $this->makeService([new Response(200, [], "log line 1\nlog line 2\n")]);
        $logs    = $service->getLogs('leymaken_api', 50);
        $this->assertStringContainsString('log line 1', $logs);
    }

    public function test_restart_container_returns_true_on_204(): void
    {
        $service = $this->makeService([new Response(204)]);
        $result  = $service->restart('leymaken_api');
        $this->assertTrue($result);
    }

    public function test_restart_container_returns_false_on_error(): void
    {
        $service = $this->makeService([new Response(500)]);
        $result  = $service->restart('leymaken_api');
        $this->assertFalse($result);
    }
}

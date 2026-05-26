<?php
namespace Tests\Unit;

use App\Services\CloudflareService;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Tests\TestCase;

class CloudflareServiceTest extends TestCase
{
    private function makeService(array $responses): CloudflareService
    {
        $mock    = new MockHandler($responses);
        $handler = HandlerStack::create($mock);
        $client  = new Client(['handler' => $handler]);
        return new CloudflareService($client);
    }

    public function test_list_zones_returns_formatted_array(): void
    {
        $body = json_encode(['result' => [[
            'id'     => 'zone123',
            'name'   => 'leymaken.com',
            'status' => 'active',
        ]], 'success' => true]);

        $service = $this->makeService([new Response(200, [], $body)]);
        $zones   = $service->listZones();

        $this->assertCount(1, $zones);
        $this->assertEquals('leymaken.com', $zones[0]['name']);
        $this->assertEquals('active', $zones[0]['status']);
    }

    public function test_list_workers_returns_formatted_array(): void
    {
        $body = json_encode(['result' => [
            ['id' => 'licorlab-web', 'created_on' => '2026-01-01T00:00:00Z', 'modified_on' => '2026-05-20T10:00:00Z'],
        ], 'success' => true]);

        $service = $this->makeService([new Response(200, [], $body)]);
        $workers = $service->listWorkers('account123');

        $this->assertCount(1, $workers);
        $this->assertEquals('licorlab-web', $workers[0]['id']);
    }
}

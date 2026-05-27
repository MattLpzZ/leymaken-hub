<?php
namespace App\Services;

use App\Models\HubSetting;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class CloudflareService
{
    private Client $client;

    public function __construct(?Client $client = null)
    {
        $token = HubSetting::getValue('CLOUDFLARE_TOKEN') ?? config('services.cloudflare.token');
        $this->client = $client ?? new Client([
            'base_uri' => 'https://api.cloudflare.com/client/v4/',
            'headers'  => [
                'Authorization' => "Bearer {$token}",
                'Content-Type'  => 'application/json',
            ],
            'timeout' => 10,
        ]);
    }

    public function listZones(): array
    {
        try {
            $res  = $this->client->get('zones?per_page=50');
            $data = json_decode($res->getBody()->getContents(), true);
            return array_map(fn($z) => [
                'id'     => $z['id'],
                'name'   => $z['name'],
                'status' => $z['status'],
            ], $data['result'] ?? []);
        } catch (GuzzleException) {
            return [];
        }
    }

    public function getZoneAnalytics(string $zoneId): array
    {
        try {
            $since = urlencode(now()->subHours(24)->toISOString());
            $until = urlencode(now()->toISOString());
            $res   = $this->client->get("zones/{$zoneId}/analytics/dashboard?since={$since}&until={$until}&continuous=true");
            $data  = json_decode($res->getBody()->getContents(), true);
            $totals = $data['result']['totals'] ?? [];
            return [
                'requests'  => $totals['requests']['all'] ?? 0,
                'bandwidth' => $totals['bandwidth']['all'] ?? 0,
                'threats'   => $totals['threats']['all'] ?? 0,
            ];
        } catch (GuzzleException) {
            return ['requests' => 0, 'bandwidth' => 0, 'threats' => 0];
        }
    }

    public function listWorkers(string $accountId): array
    {
        try {
            $res  = $this->client->get("accounts/{$accountId}/workers/scripts");
            $data = json_decode($res->getBody()->getContents(), true);
            return array_map(fn($w) => [
                'id'          => $w['id'],
                'modified_on' => $w['modified_on'],
                'created_on'  => $w['created_on'],
            ], $data['result'] ?? []);
        } catch (GuzzleException) {
            return [];
        }
    }
}

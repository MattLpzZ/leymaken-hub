<?php
namespace App\Services;

use App\Models\HubSetting;
use GuzzleHttp\Client;

class HestiaService
{
    private string $host;
    private string $user;
    private string $password;

    public function __construct()
    {
        $this->host     = HubSetting::getValue('HESTIA_HOST')     ?? env('HESTIA_HOST', '');
        $this->user     = HubSetting::getValue('HESTIA_USER')     ?? env('HESTIA_USER', 'admin');
        $this->password = HubSetting::getValue('HESTIA_PASSWORD') ?? env('HESTIA_PASSWORD', '');
    }

    public function listDomains(): array
    {
        if (!$this->host || !$this->password) return [];

        try {
            $client = new Client(['verify' => false, 'timeout' => 10]);
            $res    = $client->post("https://{$this->host}:8083/api/", [
                'form_params' => [
                    'user'     => $this->user,
                    'password' => $this->password,
                    'cmd'      => 'v-list-web-domains',
                    'arg1'     => $this->user,
                    'arg2'     => 'json',
                ],
            ]);
            $data = json_decode($res->getBody()->getContents(), true);
            if (!is_array($data)) return [];

            return array_values(array_map(fn($domain, $info) => [
                'domain'    => $domain,
                'ssl'       => ($info['SSL']       ?? 'no') === 'yes',
                'suspended' => ($info['SUSPENDED']  ?? 'no') === 'yes',
                'ip'        => $info['IP'] ?? '',
            ], array_keys($data), array_values($data)));
        } catch (\Throwable) {
            return [];
        }
    }
}

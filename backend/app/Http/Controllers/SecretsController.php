<?php

namespace App\Http\Controllers;

use App\Models\HubSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecretsController extends Controller
{
    const REGISTRY = [
        'GITHUB_TOKEN'          => ['label' => 'GitHub Token',          'group' => 'GitHub',     'mask' => true],
        'CLOUDFLARE_TOKEN'      => ['label' => 'Cloudflare Token',      'group' => 'Cloudflare', 'mask' => true],
        'CLOUDFLARE_ACCOUNT_ID' => ['label' => 'Cloudflare Account ID', 'group' => 'Cloudflare', 'mask' => false],
        'HESTIA_HOST'           => ['label' => 'Host (IP)',             'group' => 'HestiaCP',   'mask' => false],
        'HESTIA_USER'           => ['label' => 'Usuario',               'group' => 'HestiaCP',   'mask' => false],
        'HESTIA_PASSWORD'       => ['label' => 'Password',              'group' => 'HestiaCP',   'mask' => true],
        'BIZ_API_URL'           => ['label' => 'URL base',              'group' => 'Platform',   'mask' => false],
        'BIZ_EMAIL'             => ['label' => 'Email admin',           'group' => 'Platform',   'mask' => false],
        'BIZ_PASSWORD'          => ['label' => 'Password admin',        'group' => 'Platform',   'mask' => true],
    ];

    public function index(): JsonResponse
    {
        $dbKeys = HubSetting::whereIn('key', array_keys(self::REGISTRY))
            ->pluck('value', 'key');

        $items = [];
        foreach (self::REGISTRY as $key => $meta) {
            $dbVal  = $dbKeys[$key] ?? null;
            $envVal = env($key);
            $value  = $dbVal ?? $envVal;
            $source = $dbVal !== null ? 'db' : ($envVal !== null ? 'env' : null);

            $items[] = [
                'key'    => $key,
                'label'  => $meta['label'],
                'group'  => $meta['group'],
                'mask'   => $meta['mask'],
                'set'    => $value !== null,
                'source' => $source,
                'preview'=> $this->preview($value, $meta['mask']),
            ];
        }

        return response()->json($items);
    }

    public function upsert(Request $request, string $key): JsonResponse
    {
        if (!array_key_exists($key, self::REGISTRY)) {
            return response()->json(['message' => 'Key not allowed'], 403);
        }

        $request->validate(['value' => 'required|string|min:1']);

        HubSetting::set($key, $request->input('value'));

        return response()->json(['ok' => true]);
    }

    public function destroy(string $key): JsonResponse
    {
        if (!array_key_exists($key, self::REGISTRY)) {
            return response()->json(['message' => 'Key not allowed'], 403);
        }

        HubSetting::remove($key);

        return response()->json(['ok' => true]);
    }

    private function preview(?string $value, bool $mask): ?string
    {
        if ($value === null) return null;
        if (!$mask)         return $value;
        $len = strlen($value);
        if ($len <= 8)      return str_repeat('•', $len);
        return str_repeat('•', $len - 4) . substr($value, -4);
    }
}

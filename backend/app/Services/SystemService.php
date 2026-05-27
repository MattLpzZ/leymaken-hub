<?php
namespace App\Services;

class SystemService
{
    public function getStats(): array
    {
        return [
            'ram'     => $this->ram(),
            'disk'    => $this->disk(),
            'load'    => $this->load(),
            'uptime'  => $this->uptime(),
            'cpu_pct' => $this->cpuPct(),
        ];
    }

    private function ram(): array
    {
        $info = @file_get_contents('/proc/meminfo') ?: '';
        preg_match('/MemTotal:\s+(\d+)/', $info, $t);
        preg_match('/MemAvailable:\s+(\d+)/', $info, $a);
        $total = (int)($t[1] ?? 0);
        $avail = (int)($a[1] ?? 0);
        $used  = $total - $avail;
        return [
            'used_mb'  => round($used  / 1024, 1),
            'total_mb' => round($total / 1024, 1),
            'pct'      => $total > 0 ? round($used / $total * 100, 1) : 0,
        ];
    }

    private function disk(): array
    {
        $out = [];
        exec('df -B1 / 2>/dev/null', $out);
        $parts = isset($out[1]) ? preg_split('/\s+/', trim($out[1])) : [];
        $total = (int)($parts[1] ?? 0);
        $used  = (int)($parts[2] ?? 0);
        return [
            'used_gb'  => round($used  / 1073741824, 1),
            'total_gb' => round($total / 1073741824, 1),
            'pct'      => $total > 0 ? round($used / $total * 100, 1) : 0,
        ];
    }

    private function load(): array
    {
        $raw   = @file_get_contents('/proc/loadavg') ?: '0 0 0';
        $parts = explode(' ', $raw);
        return ['m1' => (float)$parts[0], 'm5' => (float)$parts[1], 'm15' => (float)$parts[2]];
    }

    private function uptime(): string
    {
        $raw  = @file_get_contents('/proc/uptime') ?: '0';
        $secs = (int)explode(' ', $raw)[0];
        $days = intdiv($secs, 86400);
        $hrs  = intdiv($secs % 86400, 3600);
        $mins = intdiv($secs % 3600, 60);
        if ($days > 0)  return "{$days}d {$hrs}h";
        if ($hrs  > 0)  return "{$hrs}h {$mins}m";
        return "{$mins}m";
    }

    private function cpuPct(): float
    {
        $cpuInfo = @file_get_contents('/proc/cpuinfo') ?: '';
        $numCpus = max(1, substr_count($cpuInfo, 'processor'));
        $load    = $this->load();
        return round(min(100, $load['m1'] / $numCpus * 100), 1);
    }
}

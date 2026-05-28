<?php
namespace App\Http\Controllers;

use App\Models\HubSetting;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SettingsController extends Controller
{
    private const ALLOWED = [
        'company_name','company_slogan','company_legal_name','company_rnc',
        'company_address','company_phone','company_email','company_website','company_logo_url',
        'telegram_bot_token','telegram_chat_id','telegram_enabled','telegram_severity',
        'print_paper_size','print_orientation','print_show_logo','print_show_footer',
        'print_footer_text','print_primary_color',
        'system_n8n_url','system_currency','system_timezone',
        'n8n_api_key','n8n_webhook_invoice_paid','n8n_webhook_new_lead','n8n_webhook_low_stock',
        'appearance_theme','appearance_color',
        'notif_container_caido','notif_n8n_error','notif_nuevo_lead',
        'notif_factura_vencida','notif_nuevo_ticket','notif_pago_recibido',
        'mail_host','mail_port','mail_username','mail_password',
        'mail_from_address','mail_from_name','mail_encryption','mail_enabled',
    ];

    public function index(): array
    {
        $rows = HubSetting::all()->pluck('value', 'key');
        $settings = [];
        foreach ($rows as $key => $value) {
            $decoded = json_decode($value, true);
            $settings[$key] = $decoded !== null ? $decoded : $value;
        }
        return $settings;
    }

    public function update(Request $request): array
    {
        $data = $request->only(self::ALLOWED);
        foreach ($data as $key => $value) {
            HubSetting::updateOrCreate(
                ['key' => $key],
                ['value' => json_encode($value)]
            );
        }
        ActivityLog::write('Configuración actualizada', 'info', 'settings');
        return ['ok' => true];
    }

    public function testEmail(Request $request): array
    {
        $to = $request->input('to', auth()->user()->email);
        try {
            Mail::raw('Test desde Leymaken Hub — SMTP configurado correctamente.', function ($m) use ($to) {
                $m->to($to)->subject('Test Email — Leymaken Hub');
            });
            return ['ok' => true];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}

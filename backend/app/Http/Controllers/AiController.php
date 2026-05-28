<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    private string $systemPrompt = "Eres el asistente de inteligencia artificial de Leymaken Hub, el sistema operativo de negocio de Matt (soymattlpzz). Leymaken es una empresa de tecnología dominicana que ofrece servicios SaaS, automatización y desarrollo. Tu función es ayudar a Matt a gestionar su negocio: interpretar datos, redactar textos, analizar situaciones, hacer seguimiento de clientes y proyectos, y responder preguntas. Sé conciso, directo y profesional. Responde en español.";

    public function chat(Request $request)
    {
        $request->validate([
            'messages'          => 'required|array',
            'messages.*.role'   => 'required|in:user,assistant',
            'messages.*.content' => 'required|string',
        ]);

        $messages = $request->input('messages');

        // --- Try Gemini first ---
        $geminiKey = env('GEMINI_API_KEY');
        if (!empty($geminiKey)) {
            try {
                $contents = array_map(function ($msg) {
                    return [
                        'role'  => $msg['role'] === 'assistant' ? 'model' : 'user',
                        'parts' => [['text' => $msg['content']]],
                    ];
                }, $messages);

                $response = Http::timeout(15)->post(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$geminiKey}",
                    [
                        'systemInstruction' => [
                            'parts' => [['text' => $this->systemPrompt]],
                        ],
                        'contents' => $contents,
                    ]
                );

                if ($response->ok()) {
                    $data = $response->json();
                    $reply = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($reply !== null) {
                        return response()->json(['reply' => $reply, 'provider' => 'gemini']);
                    }
                }
            } catch (\Throwable $e) {
                // Fall through to Ollama
            }
        }

        // --- Fallback: Ollama ---
        $ollamaUrl = env('OLLAMA_URL', 'http://leymaken_ollama:11434');
        try {
            $ollamaMessages = array_merge(
                [['role' => 'system', 'content' => $this->systemPrompt]],
                $messages
            );

            $response = Http::withoutVerifying()->timeout(30)->post(
                "{$ollamaUrl}/api/chat",
                [
                    'model'    => 'llama3.2:3b',
                    'messages' => $ollamaMessages,
                    'stream'   => false,
                ]
            );

            if ($response->ok()) {
                $data = $response->json();
                $reply = $data['message']['content'] ?? null;
                if ($reply !== null) {
                    return response()->json(['reply' => $reply, 'provider' => 'ollama']);
                }
            }
        } catch (\Throwable $e) {
            // Both providers failed
        }

        return response()->json(['error' => 'No AI provider available'], 503);
    }

    public function status(Request $request)
    {
        $geminiAvailable = !empty(env('GEMINI_API_KEY'));

        $ollamaAvailable = false;
        $ollamaUrl = env('OLLAMA_URL', 'http://leymaken_ollama:11434');
        try {
            $response = Http::withoutVerifying()->timeout(5)->get("{$ollamaUrl}/api/tags");
            if ($response->ok()) {
                $models = $response->json('models') ?? [];
                $names = array_column($models, 'name');
                $ollamaAvailable = in_array('llama3.2:3b', $names, true);
            }
        } catch (\Throwable $e) {
            // Ollama unreachable
        }

        return response()->json([
            'gemini' => ['available' => $geminiAvailable],
            'ollama' => ['available' => $ollamaAvailable, 'model' => 'llama3.2:3b'],
        ]);
    }
}

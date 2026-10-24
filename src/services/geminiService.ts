import { GoogleGenAI } from "@google/genai";
import { WEEKEND_LOCKOUT_EN, WEEKEND_LOCKOUT_ES } from "../constants";
import { DEFAULT_PERSONA } from "../modules/ai-orchestration/config/defaultPersona";

const GEMINI_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY || "" });

// System instruction now uses DEFAULT_PERSONA from ai-orchestration config
// TinyTalk has been deprecated — Teable is the single source of truth.

export async function chatWithAssistant(message: string, history: any[]) {
  const geminiModels = [
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.0-flash",
    "gemini-3.1-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ];

  if (!GEMINI_KEY) {
    throw new Error("Gemini API key missing");
  }

  const contents = [
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: Array.isArray(h.parts) ? h.parts : [{ text: h.parts || '' }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const freellmapiUrl = (import.meta as any).env?.VITE_FREELLMAPI_URL || (typeof process !== 'undefined' ? process.env?.FREELLMAPI_URL : '');
  const geminiBase = freellmapiUrl ? freellmapiUrl.replace(/\/$/, '') : 'https://generativelanguage.googleapis.com';
  const openaiBase = freellmapiUrl ? freellmapiUrl.replace(/\/$/, '') : 'https://api.openai.com';

  for (const model of geminiModels) {
    try {
      console.log(`[Client AI Fallback] Attempting Gemini model: ${model}`);
      const res = await fetch(`${geminiBase}/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: DEFAULT_PERSONA }] },
          system_instruction: { parts: [{ text: DEFAULT_PERSONA }] },
          generationConfig: { temperature: 0.7 }
        })
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`[Client AI Fallback] Success with Gemini model: ${model}`);
          return text;
        }
      }
    } catch (err) {
      console.error(`[Client AI Fallback] Error with model ${model}:`, err);
    }
  }

  // OpenAI fallback if all Gemini models fail
  const OPENAI_KEY = (import.meta as any).env?.VITE_OPENAI_API_KEY || (typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : '');
  if (OPENAI_KEY) {
    try {
      const openaiRes = await fetch(`${openaiBase}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: DEFAULT_PERSONA },
            ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.parts?.[0]?.text || '' })),
            { role: 'user', content: message },
          ],
          temperature: 0.7,
        }),
      });
      if (openaiRes.ok) {
        const data = await openaiRes.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          console.log('[Client AI Fallback] Success with OpenAI model');
          return text;
        }
      }
    } catch (e) {
      console.error('[Client AI Fallback] OpenAI error:', e);
    }
  }

  // Final fallback - call server endpoint
  try {
    const serverRes = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        history, 
        language: 'es', // default, will be overridden by context
      }),
    });
    if (serverRes.ok) {
      const data = await serverRes.json();
      return data.reply || 'Lo siento, no pude procesar tu solicitud.';
    }
  } catch (e) {
    console.error('[Client AI Fallback] Server endpoint error:', e);
  }

  return "Lo siento, estoy teniendo problemas para conectarme. Por favor intenta de nuevo o llámanos directamente.";
}
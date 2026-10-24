/**
 * La Cueva Del Chango — AI Orchestration Server Handler
 * Tenant: lacuevadelchango
 * - Scopes all Teable configuration queries to restaurant_id = 'lacuevadelchango'
 * - Uses defaultPersona + contextAnchor + Gemini/OpenAI fallback
 * - Parses <RESERVATION> JSON tag and persists via Teable
 */

import { teable, TEABLE_TABLES } from "../../../../teable";
import { DEFAULT_PERSONA } from "../../../../src/modules/ai-orchestration/config/defaultPersona";
import { buildContextAnchor } from "../../../../src/modules/ai-orchestration/utils/contextAnchor";

const TENANT_ID = "lacuevadelchango";
const TENANT_COLUMN = "restaurant_id";

async function fetchTenantConfig() {
  const tableId = TEABLE_TABLES.restaurant_secrets;
  if (!tableId) return null;

  try {
    // Target La Cueva Del Chango configuration row in Teable
    const records = await teable.findMany('restaurant_secrets', [
      { fieldId: TENANT_COLUMN, operator: 'eq', value: TENANT_ID },
    ], { take: 1 });

    if (records.length > 0) return records[0].fields;

    // Fallback — legacy rows without restaurant_id (try without filter, then filter in-memory)
    const fallback = await teable.list('restaurant_secrets', { take: 5 });
    if (fallback && Array.isArray(fallback)) {
      const match = fallback.find(
        (r: any) =>
          (r.fields?.[TENANT_COLUMN] && r.fields[TENANT_COLUMN] === TENANT_ID) ||
          (r.fields?.restaurant && String(r.fields.restaurant).toLowerCase().includes("cueva"))
      );
      if (match) return match.fields;
    }
    return null;
  } catch (error) {
    console.error("[La Cueva] restaurant_secrets fetch error:", error);
    return null;
  }
}

async function apiFetchWithTimeout(url: string, options: any, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGenerativeAIWithFallback(
  contents: any[],
  systemInstruction: string,
  geminiKey?: string,
  openaiKey?: string
): Promise<{ text: string; modelUsed: string }> {
  const errors: string[] = [];

  async function tryGemini(): Promise<{ text: string; modelUsed: string } | null> {
    if (!geminiKey) return null;
    try {
      const res = await apiFetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { temperature: 0.4, responseMimeType: "application/json" },
          }),
        },
        7000
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { text, modelUsed: "gemini-2.5-flash" };
      }
      errors.push(`Gemini ${res.status}: ${(await res.text()).substring(0, 200)}`);
    } catch (err: any) {
      errors.push(`Gemini: ${err.message || err}`);
    }
    return null;
  }

  async function tryOpenAI(): Promise<{ text: string; modelUsed: string } | null> {
    if (!openaiKey) return null;
    try {
      const messages = [
        { role: "system", content: systemInstruction },
        ...contents.map((c) => ({
          role: c.role === "user" ? "user" : "assistant",
          content: c.parts?.[0]?.text || "",
        })),
      ];
      const res = await apiFetchWithTimeout(
        `https://api.openai.com/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            temperature: 0.4,
            response_format: { type: "json_object" },
          }),
        },
        7000
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text, modelUsed: "gpt-4o-mini" };
      }
      errors.push(`OpenAI ${res.status}: ${(await res.text()).substring(0, 200)}`);
    } catch (err: any) {
      errors.push(`OpenAI: ${err.message || err}`);
    }
    return null;
  }

  const promises: Promise<{ text: string; modelUsed: string } | null>[] = [];
  if (geminiKey) promises.push(tryGemini());
  if (openaiKey) promises.push(tryOpenAI());
  if (promises.length === 0) throw new Error("No AI API keys configured");
  const result = await Promise.race(promises);
  if (result) return result;
  throw new Error("All AI models failed: " + errors.join(" | "));
}

async function saveReservationFromTag(reply: string): Promise<string> {
  const tableId = TEABLE_TABLES.reservations;
  if (!tableId) return reply;

  const resMatch = reply.match(/<RESERVATION>(.*?)<\/RESERVATION>/s);
  if (resMatch && resMatch[1]) {
    try {
      const resData = JSON.parse(resMatch[1]);
      await teable.create('reservations', {
        name: resData.name,
        email: resData.email,
        date: resData.date,
        time: resData.time,
        guests: String(resData.guests),
        restaurant: "La Cueva Del Chango",
        restaurant_id: TENANT_ID,
      });
      return reply.replace(/<RESERVATION>.*?<\/RESERVATION>/s, "").trim();
    } catch (err) {
      console.error("[La Cueva] Failed to parse/save reservation JSON", err);
    }
  }
  return reply;
}

export async function processMessage(params: {
  message: string;
  history: any[];
  language: string;
  sessionId: string;
}) {
  const { message, history, language, sessionId } = params;

  // --- Tenant-scoped Teable config fetch ---
  let tenantConfig: any = null;
  tenantConfig = await fetchTenantConfig();
  // tenantConfig can be used to override system instruction / hours / contact info

  const dateAnchor = buildContextAnchor({ language, restaurantId: TENANT_ID });
  const jsonSchema = `\nYou MUST return JSON: { "reply": "...", "actionTrigger": "OPEN_RESERVATION_CALENDAR"|"NONE", "prefilledDate": "YYYY-MM-DD|null", "prefilledTime": "HH:MM|null" }\n`;
  const finalInstruction = dateAnchor + DEFAULT_PERSONA + jsonSchema;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const contents = [
    ...(history || []).map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.parts?.[0]?.text || h.text || "" }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const result = await callGenerativeAIWithFallback(contents, finalInstruction, geminiKey, openaiKey);

  let responseData: any = { reply: "", actionTrigger: "NONE", prefilledDate: null, prefilledTime: null };
  try {
    let clean = result.text.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    responseData = JSON.parse(clean);
    responseData.reply = await saveReservationFromTag(responseData.reply);
  } catch {
    responseData.reply = await saveReservationFromTag(result.text);
  }

  // Log chat (best-effort, tenant-scoped)
  if (sessionId && message) {
    try {
      const chatLogsTableId = TEABLE_TABLES.chat_logs;
      if (chatLogsTableId) {
        await teable.create('chat_logs', {
          session_id: sessionId,
          role: "user",
          message: message.substring(0, 2000),
          language: language || "en",
          channel: "web",
          restaurant_id: TENANT_ID,
        });
        if (responseData.reply) {
          await teable.create('chat_logs', {
            session_id: sessionId,
            role: "assistant",
            message: String(responseData.reply).substring(0, 2000),
            language: language || "en",
            channel: "web",
            restaurant_id: TENANT_ID,
          });
        }
      }
    } catch {}
  }

  return { ...responseData, sessionId, tenantConfig: tenantConfig ? { restaurant_id: TENANT_ID } : null };
}

export const TENANT_ID_EXPORT = TENANT_ID;
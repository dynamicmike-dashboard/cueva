import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

console.log("=== ENV CHECK ===");
console.log("SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
console.log("SUPABASE_KEY:", SUPABASE_KEY ? "✓" : "✗");
console.log("GEMINI_KEY:", GEMINI_KEY ? "✓ (" + GEMINI_KEY.substring(0, 20) + "...)" : "✗");
console.log("OPENAI_KEY:", OPENAI_KEY ? "✓ (" + OPENAI_KEY.substring(0, 20) + "...)" : "✗");

// Test Gemini directly
async function testGemini() {
  console.log("\n=== TESTING GEMINI ===");
  const model = "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Say hello in one word" }] }],
        generationConfig: { temperature: 0.4, responseMimeType: "application/json" }
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log("SUCCESS:", JSON.stringify(data.candidates?.[0]?.content?.parts?.[0]?.text));
    } else {
      const err = await res.text();
      console.log("FAILED status:", res.status);
      console.log("ERROR:", err.substring(0, 500));
    }
  } catch (e) {
    console.log("EXCEPTION:", e.message);
  }
}

// Test old model names
async function testOldModels() {
  console.log("\n=== TESTING FAKE MODEL NAMES ===");
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.0-flash", "gemini-3.1-pro"];
  
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "hi" }] }],
          generationConfig: { temperature: 0.4 }
        })
      });
      console.log(`${model}: ${res.status} ${res.statusText}`);
    } catch (e) {
      console.log(`${model}: EXCEPTION - ${e.message}`);
    }
  }
}

// Test OpenAI
async function testOpenAI() {
  console.log("\n=== TESTING OPENAI ===");
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "say hello" }],
        temperature: 0.4
      })
    });
    if (res.ok) {
      const data = await res.json();
      console.log("SUCCESS:", data.choices?.[0]?.message?.content);
    } else {
      const err = await res.text();
      console.log("FAILED status:", res.status);
      console.log("ERROR:", err.substring(0, 500));
    }
  } catch (e) {
    console.log("EXCEPTION:", e.message);
  }
}

await testGemini();
await testOldModels();
await testOpenAI();

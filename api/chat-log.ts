import { teable, TEABLE_TABLES } from '../teable';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const { sessionId, role, message, language, channel } = await req.json();
    const tb = await getTeable();
    const tableId = TEABLE_TABLES.chat_logs;
    
    if (tableId && sessionId && message) {
      try {
        await tb.create('chat_logs', {
          session_id: sessionId,
          role: role || 'user',
          message: (message || '').substring(0, 2000),
          language: language || 'en',
          channel: channel || 'web',
          restaurant_id: 'lacuevadelchango'
        });
      } catch {}
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function getTeable() {
  const { teable } = await import('../teable');
  return teable;
}
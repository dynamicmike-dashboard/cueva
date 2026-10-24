import { teable, TEABLE_TABLES } from '../teable';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const tb = await getTeable();
  const tableId = TEABLE_TABLES.blackout_periods;

  if (!tableId) {
    return new Response(JSON.stringify({ error: 'Blackout periods table not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    
    const filter: Array<{ fieldId: string; operator: string; value: any }> = [];
    if (date) {
      filter.push({ fieldId: 'date', operator: 'eq', value: date });
    }

    const records = await tb.findMany('blackout_periods', filter, { take: 500 });
    const blackouts = records.map(r => r.fields);

    return new Response(JSON.stringify({ success: true, data: blackouts }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[API blackouts] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function getTeable() {
  const { teable } = await import('../teable');
  return teable;
}
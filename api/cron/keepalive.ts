import { teable, TEABLE_TABLES } from '../../teable';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const tb = await getTeable();
  const tableId = TEABLE_TABLES.reservations;

  if (!tableId) {
    return new Response(JSON.stringify({ error: "Reservations table not configured" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Explicit activity poke on your reservation system to ensure pools stay warm
    const records = await tb.findMany('reservations', [], { take: 1 });
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: "La Cueva Del Chango database connection refreshed successfully." 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getTeable() {
  const { teable } = await import('../../teable');
  return teable;
}
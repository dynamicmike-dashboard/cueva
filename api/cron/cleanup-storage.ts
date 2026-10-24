import { teable, TEABLE_TABLES } from '../../teable';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const tb = await getTeable();
  const tableId = TEABLE_TABLES.factura_requests;

  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    console.log(`[CRON] Cleaning files older than: ${sixMonthsAgo.toISOString()}`);
    
    // Note: Teable doesn't have storage. This is a placeholder.
    // In production, integrate with S3/Cloudinary/Teable attachments API
    return new Response(JSON.stringify({ 
      success: true, 
      deleted: 0, 
      filesScanned: 0, 
      note: "Teable doesn't have storage; implement S3/Cloudinary cleanup separately" 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error("[CRON Error]", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getTeable() {
  const { teable } = await import('../../teable');
  return teable;
}
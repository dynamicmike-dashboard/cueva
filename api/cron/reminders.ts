import { teable, TEABLE_TABLES } from '../../teable';

export const config = { runtime: 'edge' };

const EMAIL_HTML = (message: string) => `<div style='font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: var(--primary-beige);'>
  <h1 style='color: var(--primary);'>La Cueva Del Chango</h1>
  <p>${message}</p>
  <p style='font-size: 12px; color: #999;'>Calle 38 - Playa del Carmen</p>
</div>`;

async function sendEmail(resendKey: string, email: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'La Cueva Del Chango <onboarding@resend.dev>', to: [email], subject, html })
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function handler(req: Request) {
  const tb = await getTeable();
  const resTableId = TEABLE_TABLES.reservations;
  const secretsTableId = TEABLE_TABLES.restaurant_secrets;

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return new Response(JSON.stringify({ error: 'Resend API Key missing' }), { status: 500 });

  let template = "Hola {name}, te recordamos tu reservación en La Cueva Del Chango para {time}. ¡Te esperamos!";
  if (secretsTableId) {
    try {
      const records = await tb.findMany('restaurant_secrets', [], { take: 1 });
      const secrets = records[0]?.fields;
      if (secrets?.reminder_message) template = secrets.reminder_message;
    } catch {}
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  let resvs24: any[] = [];
  if (resTableId) {
    const records = await tb.findMany('reservations', [{ fieldId: 'date', operator: 'eq', value: tomorrowStr }]);
    resvs24 = records.map(r => r.fields);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  let resvsToday: any[] = [];
  if (resTableId) {
    const records = await tb.findMany('reservations', [{ fieldId: 'date', operator: 'eq', value: todayStr }]);
    resvsToday = records.map(r => r.fields);
  }

  const resvs2h = resvsToday.filter((r: any) => {
    const [rh, rm] = (r.time || '').split(':').map(Number);
    const resvTime = new Date();
    resvTime.setHours(rh, rm, 0, 0);
    const diffHrs = (resvTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHrs > 0 && diffHrs <= 2.1;
  });

  const allToNotify = [...resvs24, ...resvs2h];
  let sentCount = 0;

  for (const resv of allToNotify) {
    if (!resv.email) continue;
    const message = template.replace('{name}', resv.name || 'Cliente').replace('{time}', resv.time || '');
    if (await sendEmail(resendKey, resv.email, 'Recordatorio de Reservación - La Cueva Del Chango', EMAIL_HTML(message))) {
      sentCount++;
    }
  }

  return new Response(JSON.stringify({ success: true, processed: allToNotify.length, sent: sentCount }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getTeable() {
  const { teable } = await import('../../teable');
  return teable;
}
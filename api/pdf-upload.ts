import { randomUUID } from 'node:crypto';
import { requireAdminSession } from '../lib/admin-session';

const BUCKET = 'portfolio-pdfs';

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido.' }, { status: 405 });
  }

  const unauthorized = requireAdminSession(request);
  if (unauthorized) return unauthorized;

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json(
      { error: 'Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as { filename?: unknown };
    if (typeof body.filename !== 'string' || !body.filename.toLowerCase().endsWith('.pdf')) {
      return Response.json({ error: 'Debes indicar un nombre de archivo PDF válido.' }, { status: 400 });
    }

    const pathname = `documents/${randomUUID()}.pdf`;
    const uploadUrl = `${supabaseUrl}/storage/v1/object/upload/sign/${BUCKET}/${pathname}`;
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    if (!uploadResponse.ok) {
      const details = await uploadResponse.text();
      console.error('Supabase Storage no pudo firmar la carga del PDF:', uploadResponse.status, details);
      return Response.json(
        { error: `Supabase Storage respondió HTTP ${uploadResponse.status}. Comprueba el bucket portfolio-pdfs.` },
        { status: 502 }
      );
    }

    const signed = (await uploadResponse.json()) as { url?: unknown };
    if (typeof signed.url !== 'string' || !signed.url.startsWith('/object/upload/sign/')) {
      console.error('Supabase Storage devolvió una URL de carga firmada inválida.');
      return Response.json({ error: 'No se pudo preparar la carga del PDF.' }, { status: 502 });
    }

    return Response.json({
      uploadUrl: `${supabaseUrl}/storage/v1${signed.url}`,
      url: `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${pathname}`,
      message: 'Carga de PDF preparada.',
    });
  } catch (error) {
    console.error('No se pudo preparar la carga del PDF en Supabase Storage:', error);
    return Response.json({ error: 'No se pudo preparar la carga del PDF.' }, { status: 502 });
  }
}

export default { fetch: handler };

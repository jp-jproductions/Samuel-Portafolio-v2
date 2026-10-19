import { createHash, randomUUID } from 'node:crypto';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin) {
    return new Response(JSON.stringify({ error: 'Origen no permitido' }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({
        error:
          'Cloudinary no está configurado. Define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el entorno del servidor.',
      }),
      { status: 503, headers: JSON_HEADERS }
    );
  }

  try {
    const body = (await request.json()) as { resourceType?: unknown };
    if (body.resourceType !== 'image' && body.resourceType !== 'video') {
      return new Response(JSON.stringify({ error: 'Tipo de archivo no permitido' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const params = {
      folder: 'portfolio-assets',
      public_id: randomUUID(),
      timestamp: Math.floor(Date.now() / 1000).toString(),
    };
    const paramsToSign = Object.entries(params)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    const signature = createHash('sha1')
      .update(`${paramsToSign}${apiSecret}`)
      .digest('hex');

    return new Response(
      JSON.stringify({
        cloudName,
        apiKey,
        resourceType: body.resourceType,
        ...params,
        signature,
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (error) {
    console.error('No se pudo generar una firma de Cloudinary:', error);
    return new Response(JSON.stringify({ error: 'Solicitud de firma inválida' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }
}

export default { fetch: handler };

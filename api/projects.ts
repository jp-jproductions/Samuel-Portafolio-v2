import { put, head } from '@vercel/blob';



export default async function handler(request: Request): Promise<Response> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (request.method === 'GET') {
    try {
      if (!token) {
        return new Response(
          JSON.stringify({ data: null, warning: 'BLOB_READ_WRITE_TOKEN no configurado' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Buscar si ya existe portfolio-data.json en el almacenamiento de Vercel Blob
      const blobMeta = await head('portfolio-data.json', { token }).catch(() => null);

      if (!blobMeta) {
        return new Response(
          JSON.stringify({ data: null, message: 'No hay datos guardados aún en Vercel Blob' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Obtener el contenido actualizado sin caché
      const response = await fetch(blobMeta.url, { cache: 'no-store' });
      const data = await response.json();

      return new Response(JSON.stringify({ data, url: blobMeta.url }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: (err as Error).message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  if (request.method === 'POST') {
    try {
      if (!token) {
        return new Response(
          JSON.stringify({
            error:
              'No se encontró la variable de entorno BLOB_READ_WRITE_TOKEN en Vercel. Ve a tu proyecto en Vercel > Storage > Blob y vincúlalo.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const body = await request.json();

      // Guardar el portfolio completo (proyectos, categorías, textos y cv) en Vercel Blob
      const blob = await put('portfolio-data.json', JSON.stringify(body, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
        token,
      });

      return new Response(
        JSON.stringify({
          success: true,
          url: blob.url,
          message: 'Portfolio sincronizado con éxito en Vercel Blob',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({ error: (err as Error).message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

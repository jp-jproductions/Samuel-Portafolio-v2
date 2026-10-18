import { put, head } from '@vercel/blob';

export default async function handler(request: Request): Promise<Response> {
  const token =
    request.headers.get('x-blob-token') ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    process.env.BLOB_READ_WRITE_TOKEN;

  if (request.method === 'GET') {
    try {
      if (!token) {
        return new Response(
          JSON.stringify({
            connected: false,
            data: null,
            warning: 'BLOB_READ_WRITE_TOKEN no configurado',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Probar si el token es válido y buscar si ya existe portfolio-data.json
      let blobMeta = null;
      try {
        blobMeta = await head('portfolio-data.json', { token });
      } catch (headErr: any) {
        if (headErr?.name === 'BlobNotFoundError' || headErr?.message?.toLowerCase().includes('could not find')) {
          // El token y el store son 100% válidos, pero el archivo aún no se ha subido
          blobMeta = null;
        } else {
          // Token inválido, store inexistente, acceso denegado o error de autenticación
          return new Response(
            JSON.stringify({
              connected: false,
              error: `Error de autenticación con Vercel Blob: ${headErr?.message || 'Token o almacén no válido'}`,
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }

      if (!blobMeta) {
        return new Response(
          JSON.stringify({
            connected: true,
            data: null,
            message:
              'Conectado a Vercel Blob con éxito. Aún no se ha sincronizado el archivo portfolio-data.json.',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Obtener el contenido actualizado sin caché
      const response = await fetch(blobMeta.url, { cache: 'no-store' });
      const data = await response.json();

      return new Response(
        JSON.stringify({
          connected: true,
          data,
          url: blobMeta.url,
          message: 'Conectado a Vercel Blob. Datos sincronizados correctamente.',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      );
    } catch (err) {
      return new Response(
        JSON.stringify({
          connected: false,
          error: (err as Error).message,
        }),
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
            success: false,
            error:
              'No se encontró la variable de entorno BLOB_READ_WRITE_TOKEN ni un token configurado. Vincula tu proyecto en Vercel > Storage > Blob o introduce tu token en el panel.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const body = await request.json();

      // Guardar el portfolio completo en Vercel Blob
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
        JSON.stringify({
          success: false,
          error: (err as Error).message,
        }),
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

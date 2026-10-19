import { list, put, head } from '@vercel/blob';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error) || 'Error desconocido de Vercel Blob';
  } catch {
    return 'Error desconocido de Vercel Blob';
  }
}

async function handler(request: Request): Promise<Response> {
  const rawToken =
    request.headers.get('x-blob-token') ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    '';

  // Limpieza automática (por si el usuario copió con comillas, espacios o BLOB_READ_WRITE_TOKEN=)
  const token = rawToken
    .replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();

  // Si el usuario copió el Store ID en lugar del Token secreto
  if (token && token.startsWith('store_')) {
    return new Response(
      JSON.stringify({
        connected: false,
        error: `Has ingresado el ID del almacén ("${token}"). Vercel Blob requiere el token secreto que empieza por "vercel_blob_rw_...". Lo encuentras en Vercel > tu Blob Store > pestaña Settings > Tokens.`,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

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

      // 1. Probar validez del token en Vercel Blob mediante list({ limit: 1 })
      try {
        await list({ limit: 1, token });
      } catch (listErr: any) {
        return new Response(
          JSON.stringify({
            connected: false,
            error: `Error de autenticación con Vercel Blob: ${listErr?.message || 'Token no válido'}. Asegúrate de copiar el token que empieza por "vercel_blob_rw_".`,
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // 2. Si el token es válido, verificar si ya existe portfolio-data.json
      let blobMeta = null;
      try {
        blobMeta = await head('portfolio-data.json', { token });
      } catch {
        // Archivo no creado aún
        blobMeta = null;
      }

      if (!blobMeta) {
        return new Response(
          JSON.stringify({
            connected: true,
            data: null,
            message:
              '🟢 ¡Conexión exitosa a tu Vercel Blob Store! Aún no has sincronizado portfolio-data.json. Haz clic en "Sincronizar proyectos ahora".',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Obtener el contenido actualizado sin caché
      const response = await fetch(`${blobMeta.url}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();

      return new Response(
        JSON.stringify({
          connected: true,
          data,
          url: blobMeta.url,
          message: '🟢 Conectado a Vercel Blob. Datos sincronizados correctamente.',
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
        allowOverwrite: true,
        cacheControlMaxAge: 60,
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
      console.error('No se pudo sincronizar portfolio-data.json con Vercel Blob:', {
        name: err instanceof Error ? err.name : typeof err,
        message: getErrorMessage(err),
        statusCode:
          typeof err === 'object' && err !== null && 'statusCode' in err
            ? err.statusCode
            : undefined,
        code:
          typeof err === 'object' && err !== null && 'code' in err ? err.code : undefined,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: getErrorMessage(err),
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

export default { fetch: handler };

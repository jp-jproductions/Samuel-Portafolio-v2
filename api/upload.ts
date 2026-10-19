import { put } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');
  const rawToken =
    request.headers.get('x-blob-token') ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    '';

  const token = rawToken
    .replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();

  // =========================================================================
  // MÉTODO 1: SERVER UPLOAD DIRECTO (El método simple con ?filename=...)
  // =========================================================================
  if (filename) {
    try {
      if (!request.body) {
        return new Response(JSON.stringify({ error: 'No se envió cuerpo de archivo' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!token) {
        return new Response(
          JSON.stringify({
            error:
              'No se encontró la variable de entorno BLOB_READ_WRITE_TOKEN en Vercel ni un token configurado en el panel.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const cleanFileName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const blob = await put(cleanFileName, request.body, {
        access: 'public',
        token,
      });

      return new Response(JSON.stringify(blob), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: (error as Error).message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // =========================================================================
  // MÉTODO 2: CLIENT UPLOADS QUICKSTART (Para archivos > 4.5 MB: Vídeos, RAW, PDFs)
  // =========================================================================
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/svg+xml',
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'application/pdf',
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500 MB (soporta vídeos pesados)
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Blob subido con éxito a Vercel:', blob.url);
      },
    });

    return new Response(JSON.stringify(jsonResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export default { fetch: handler };

import { put } from '@vercel/blob';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';



export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  // =========================================================================
  // MÉTODO 1: SERVER UPLOAD DIRECTO (El método simple con ?filename=...)
  // =========================================================================
  // Recibe directamente el archivo en el body del request.
  // Ideal para imágenes ligeras (< 4.5 MB debido al límite de funciones serverless de Vercel).
  if (filename) {
    try {
      if (!request.body) {
        return new Response(JSON.stringify({ error: 'No se envió cuerpo de archivo' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const token = process.env.BLOB_READ_WRITE_TOKEN;
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
  // La subida va directamente del navegador del usuario a Vercel Blob sin pasar
  // por el límite de 4.5 MB de la función (permite hasta 500 MB).
  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
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

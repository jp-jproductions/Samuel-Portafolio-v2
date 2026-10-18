import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // Autorizar tipos de archivo permitidos para el portafolio de Samuel Restrepo
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
          maximumSizeInBytes: 150 * 1024 * 1024, // 150 MB (soporta vídeos pesados, fotos RAW/4K y PDFs)
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Registro de subida completada en Vercel
        console.log('Vercel Blob subido con éxito:', blob.url);
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

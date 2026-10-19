import { requireAdminSession } from '../lib/admin-session';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, max-age=0',
};

function getSupabaseConfig():
  | { url: string; serviceRoleKey: string }
  | { error: string } {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return {
      error:
        'Supabase no está configurado. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en las variables de entorno del servidor.',
    };
  }
  return { url, serviceRoleKey };
}

function isConfigError(
  config: ReturnType<typeof getSupabaseConfig>
): config is { error: string } {
  return 'error' in config;
}

function getSupabaseHeaders(serviceRoleKey: string): HeadersInit {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
}

async function handler(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    const config = getSupabaseConfig();
    if (isConfigError(config)) {
      return Response.json(
        { connected: false, error: config.error },
        { status: 503, headers: JSON_HEADERS }
      );
    }

    try {
      const response = await fetch(
        `${config.url}/rest/v1/portfolio_state?id=eq.current&select=data,updated_at`,
        {
          headers: getSupabaseHeaders(config.serviceRoleKey),
          cache: 'no-store',
        }
      );
      if (!response.ok) {
        const details = await response.text();
        console.error('Supabase no pudo leer portfolio_state:', response.status, details);
        return Response.json(
          { connected: false, error: `Supabase respondió HTTP ${response.status}. Verifica la tabla portfolio_state.` },
          { status: 502, headers: JSON_HEADERS }
        );
      }

      const rows = (await response.json()) as Array<{
        data: unknown;
        updated_at: string;
      }>;
      return Response.json(
        {
          connected: true,
          data: rows[0]?.data ?? null,
          updatedAt: rows[0]?.updated_at ?? null,
          message: rows.length
            ? 'Datos del portafolio cargados desde Supabase.'
            : 'Supabase conectado. Aún no hay datos guardados; se conservan los datos locales de este navegador.',
        },
        { headers: JSON_HEADERS }
      );
    } catch (error) {
      console.error('No se pudo conectar con Supabase para leer el portafolio:', error);
      return Response.json(
        { connected: false, error: 'No se pudo conectar con Supabase.' },
        { status: 502, headers: JSON_HEADERS }
      );
    }
  }

  if (request.method === 'POST') {
    const unauthorized = requireAdminSession(request);
    if (unauthorized) return unauthorized;

    const config = getSupabaseConfig();
    if (isConfigError(config)) {
      return Response.json(
        { success: false, error: config.error },
        { status: 503, headers: JSON_HEADERS }
      );
    }

    try {
      const data = await request.json();
      const response = await fetch(
        `${config.url}/rest/v1/portfolio_state?on_conflict=id`,
        {
          method: 'POST',
          headers: {
            ...getSupabaseHeaders(config.serviceRoleKey),
            Prefer: 'resolution=merge-duplicates,return=representation',
          },
          body: JSON.stringify({
            id: 'current',
            data,
            updated_at: new Date().toISOString(),
          }),
        }
      );
      if (!response.ok) {
        const details = await response.text();
        console.error('Supabase no pudo guardar portfolio_state:', response.status, details);
        return Response.json(
          { success: false, error: `Supabase respondió HTTP ${response.status}. Verifica la tabla portfolio_state.` },
          { status: 502, headers: JSON_HEADERS }
        );
      }

      return Response.json(
        { success: true, message: 'Portafolio guardado en Supabase.' },
        { headers: JSON_HEADERS }
      );
    } catch (error) {
      console.error('No se pudo sincronizar el portafolio con Supabase:', error);
      return Response.json(
        { success: false, error: 'No se pudo guardar el portafolio en Supabase.' },
        { status: 400, headers: JSON_HEADERS }
      );
    }
  }

  return Response.json({ error: 'Método no permitido.' }, { status: 405 });
}

export default { fetch: handler };

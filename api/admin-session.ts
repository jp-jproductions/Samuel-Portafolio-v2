import {
  clearAdminSessionCookie,
  createAdminSessionCookie,
  hasAdminSession,
  isSameOrigin,
  isValidAdminPassword,
} from '../lib/admin-session';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, max-age=0',
};

async function handler(request: Request): Promise<Response> {
  if (request.method === 'GET') {
    return Response.json({ authenticated: hasAdminSession(request) }, { headers: JSON_HEADERS });
  }

  if (!isSameOrigin(request)) {
    return Response.json({ error: 'Origen no permitido.' }, { status: 403, headers: JSON_HEADERS });
  }

  if (request.method === 'DELETE') {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: {
        ...JSON_HEADERS,
        'Set-Cookie': clearAdminSessionCookie(request),
      },
    });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido.' }, { status: 405, headers: JSON_HEADERS });
  }

  if (!process.env.PORTFOLIO_ADMIN_PASSWORD) {
    return Response.json(
      { error: 'El acceso de administrador no está configurado en el servidor.' },
      { status: 503, headers: JSON_HEADERS }
    );
  }

  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password !== 'string' || !isValidAdminPassword(body.password)) {
      return Response.json(
        { error: 'Contraseña incorrecta.' },
        { status: 401, headers: JSON_HEADERS }
      );
    }

    return new Response(JSON.stringify({ authenticated: true }), {
      status: 200,
      headers: {
        ...JSON_HEADERS,
        'Set-Cookie': createAdminSessionCookie(request),
      },
    });
  } catch (error) {
    console.error('No se pudo iniciar la sesión de administrador:', error);
    return Response.json(
      { error: 'Solicitud de inicio de sesión inválida.' },
      { status: 400, headers: JSON_HEADERS }
    );
  }
}

export default { fetch: handler };

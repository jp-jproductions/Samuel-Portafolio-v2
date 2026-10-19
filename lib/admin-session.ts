import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'portfolio_admin_session';
const SESSION_DURATION_SECONDS = 12 * 60 * 60;

function getSessionSecret(): string | undefined {
  return process.env.PORTFOLIO_ADMIN_PASSWORD;
}

function sign(expiration: string, secret: string): string {
  return createHmac('sha256', secret).update(expiration).digest('hex');
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return Boolean(origin && origin === new URL(request.url).origin);
}

export function isValidAdminPassword(password: string): boolean {
  const expected = getSessionSecret();
  if (!expected) return false;
  const providedBytes = Buffer.from(password);
  const expectedBytes = Buffer.from(expected);
  return (
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
  );
}

export function createAdminSessionCookie(request: Request): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error('PORTFOLIO_ADMIN_PASSWORD no está configurada.');

  const expiration = String(Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS);
  const value = `${expiration}.${sign(expiration, secret)}`;
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function clearAdminSessionCookie(request: Request): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function hasAdminSession(request: Request): boolean {
  const secret = getSessionSecret();
  if (!secret) return false;

  const cookie = request.headers.get('cookie');
  if (!cookie) return false;

  const value = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!value) return false;

  const [expiration, signature] = value.split('.');
  if (!expiration || !signature || Number(expiration) <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expectedBytes = Buffer.from(sign(expiration, secret));
  const signatureBytes = Buffer.from(signature);
  return (
    signatureBytes.length === expectedBytes.length &&
    timingSafeEqual(signatureBytes, expectedBytes)
  );
}

export function requireAdminSession(request: Request): Response | null {
  if (!isSameOrigin(request)) {
    return Response.json({ error: 'Origen no permitido.' }, { status: 403 });
  }
  if (!hasAdminSession(request)) {
    return Response.json({ error: 'La sesión de administrador expiró. Inicia sesión de nuevo.' }, {
      status: 401,
    });
  }
  return null;
}

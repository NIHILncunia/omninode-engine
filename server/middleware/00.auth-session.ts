import { restoreRequestAdmin } from '../utils/auth-session';

const publicPagePaths = new Set([
  '/',
  '/signin',
  '/admin-permission-request',
  '/docs',
  '/about',
]);

function isStaticPath(path: string): boolean {
  return path.startsWith('/_nuxt/') || /\/[^/]+\.[^/]+$/.test(path);
}

export function isProtectedPageRequest(path: string): boolean {
  return !path.startsWith('/api/')
    && !path.startsWith('/docs/')
    && !publicPagePaths.has(path)
    && !isStaticPath(path);
}

export default defineEventHandler(async event => {
  if (!isProtectedPageRequest(event.path)) {
    return;
  }

  const admin = await restoreRequestAdmin(event);

  if (!admin) {
    return sendRedirect(event, '/signin');
  }

  event.context.authenticatedAdmin = admin;
});

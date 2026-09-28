/**
 * Vercel rewrites may invoke a single function with the subpath in a query param.
 * Connect middleware expects `req.url` like `/api/realtime/token?tier=mini`.
 *
 * @param {import('http').IncomingMessage} req
 * @param {string} [pathQueryKey]
 */
export function normalizeVercelApiRequestUrl(req, pathQueryKey = '__gev_path') {
  const url = new URL(req.url || '/', 'http://gev.local');
  const fromQuery =
    req.query?.[pathQueryKey] ?? url.searchParams.get(pathQueryKey);
  if (fromQuery == null || fromQuery === '') return;
  const segment = Array.isArray(fromQuery)
    ? fromQuery.join('/')
    : String(fromQuery);
  url.searchParams.delete(pathQueryKey);
  const qs = url.searchParams.toString();
  req.url = `/api/${segment}${qs ? `?${qs}` : ''}`;
}

import { handleVercelApiRequest } from '../server/standalone/vercel-api.js';
import { normalizeVercelApiRequestUrl } from '../server/standalone/vercel-request.js';

/** @type {import('@vercel/node').VercelApiHandler} */
export default function handler(req, res) {
  normalizeVercelApiRequestUrl(req);
  return handleVercelApiRequest(req, res);
}

export const config = {
  maxDuration: 60,
};

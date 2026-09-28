import connect from 'connect';

import { localProviderPlugins } from '../providers/local.js';
import { apiNotFoundPlugin } from './api-not-found.js';

/** @type {import('connect').Server | null} */
let apiApp = null;

/**
 * Same provider stack as `vite preview`: preview hooks only so credential
 * editing (`/api/setup/*`) stays development-only.
 */
export function createVercelApiApp() {
  if (apiApp) return apiApp;
  apiApp = connect();
  const server = { middlewares: apiApp };
  for (const plugin of [...localProviderPlugins(), apiNotFoundPlugin()]) {
    if (typeof plugin.configurePreviewServer === 'function') {
      plugin.configurePreviewServer(server);
    }
  }
  return apiApp;
}

/** @type {import('@vercel/node').VercelApiHandler} */
export function handleVercelApiRequest(req, res) {
  createVercelApiApp()(req, res);
}

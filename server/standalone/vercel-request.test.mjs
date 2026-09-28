import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeVercelApiRequestUrl } from './vercel-request.js';

test('rewrite query param restores connect-style /api paths', () => {
  const req = { url: '/api/catchall?__gev_path=realtime/token&tier=mini' };
  normalizeVercelApiRequestUrl(req);
  assert.equal(req.url, '/api/realtime/token?tier=mini');
});

test('leaves direct function invocations unchanged', () => {
  const req = { url: '/api/realtime/token?tier=standard' };
  normalizeVercelApiRequestUrl(req);
  assert.equal(req.url, '/api/realtime/token?tier=standard');
});

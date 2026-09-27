import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';

import { createVercelApiApp } from './vercel-api.js';

test('Vercel API stack matches preview: providers on, setup routes off', async (t) => {
  const prev = process.env.OPENSKY_AUTH_MODE;
  process.env.OPENSKY_AUTH_MODE = 'anon';
  t.after(() => {
    if (prev === undefined) delete process.env.OPENSKY_AUTH_MODE;
    else process.env.OPENSKY_AUTH_MODE = prev;
  });

  const app = createVercelApiApp();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const origin = `http://127.0.0.1:${port}`;
  t.after(() => server.close());

  const firms = await fetch(`${origin}/api/firms/status`);
  assert.equal(firms.status, 200);
  assert.match(firms.headers.get('content-type'), /application\/json/);

  const setup = await fetch(`${origin}/api/setup/status`);
  assert.equal(setup.status, 404);
  assert.deepEqual(await setup.json(), { error: 'Unknown API route' });

  const missing = await fetch(`${origin}/api/does-not-exist`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'Unknown API route' });
});

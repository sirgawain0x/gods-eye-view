import { buildAiStatusPayload } from './provider-config.js';

function handleAiStatus(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  res.statusCode = 200;
  res.end(JSON.stringify(buildAiStatusPayload()));
}

export { handleAiStatus };

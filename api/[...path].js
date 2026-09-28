import { createVercelApiApp } from '../server/standalone/vercel-api.js';

const app = createVercelApiApp();

/** @type {import('@vercel/node').VercelApiHandler} */
export default function handler(req, res) {
  app(req, res);
}

export const config = {
  maxDuration: 60,
};

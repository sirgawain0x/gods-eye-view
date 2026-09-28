import { handleHudSummary } from './hud-summary.js';
import { handleAiStatus } from './status.js';

/** Vite plugin: interchangeable HUD AI (OpenAI or Google Gemini) + capability status. */
function aiProviderProxy() {
  function install(middlewares) {
    middlewares.use('/api/ai/status', handleAiStatus);
    middlewares.use('/api/ai/hud-summary', handleHudSummary);
    middlewares.use('/api/openai/hud-summary', handleHudSummary);
  }
  return {
    name: 'ai-provider-proxy',
    configureServer(server) {
      install(server.middlewares);
    },
    configurePreviewServer(server) {
      install(server.middlewares);
    },
  };
}

export { aiProviderProxy };

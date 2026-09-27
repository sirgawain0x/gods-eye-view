import { HUD_SUMMARY_INSTRUCTIONS } from '../../../src/hudSummaryResponse.js';
import { keylessHudSummaryResponse } from '../../../src/hudSummaryResponse.js';
import { readRequestBody } from '../common/request.js';
import { enforceOptInRateLimit, openAiRateLimiter } from '../openai/rate-limit.js';
import { OPENAI_HUD_SUMMARY_MODEL_DEFAULT } from '../openai/constants.js';
import {
  extractGeminiResponseText,
  extractOpenAiResponseText,
  toFiveWordHudSummary,
} from './hud-text.js';
import { resolveHudProvider } from './provider-config.js';

const GEMINI_HUD_MODEL_DEFAULT = 'gemini-2.0-flash';

async function summarizeWithOpenAi(context, apiKey, env = process.env) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model:
        env.OPENAI_HUD_SUMMARY_MODEL || OPENAI_HUD_SUMMARY_MODEL_DEFAULT,
      instructions: HUD_SUMMARY_INSTRUCTIONS,
      input: JSON.stringify(context),
      reasoning: { effort: 'minimal' },
      max_output_tokens: 100,
    }),
  });
  const data = await response.json().catch(() => ({}));
  const summary = toFiveWordHudSummary(extractOpenAiResponseText(data));
  return { response, summary, provider: 'openai' };
}

async function summarizeWithGemini(context, apiKey, env = process.env) {
  const model = String(
    env.GEMINI_HUD_SUMMARY_MODEL || GEMINI_HUD_MODEL_DEFAULT,
  ).trim();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${HUD_SUMMARY_INSTRUCTIONS}\n\nContext JSON:\n${JSON.stringify(context)}`,
            },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 64, temperature: 0.2 },
    }),
  });
  const data = await response.json().catch(() => ({}));
  const summary = toFiveWordHudSummary(extractGeminiResponseText(data));
  return { response, summary, provider: 'google' };
}

async function handleHudSummary(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const hud = resolveHudProvider();
  const keyless = keylessHudSummaryResponse(hud);
  if (keyless) {
    res.statusCode = keyless.statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify(keyless.payload));
    return;
  }

  if (!enforceOptInRateLimit(openAiRateLimiter(), req, res)) return;

  try {
    const body = await readRequestBody(req, 64 * 1024);
    const context = JSON.parse(body || '{}');
    let result;
    if (hud.provider === 'google') {
      result = await summarizeWithGemini(context, String(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY).trim());
    } else {
      result = await summarizeWithOpenAi(context, String(process.env.OPENAI_API_KEY).trim());
    }
    const { response, summary, provider } = result;
    res.statusCode = response.ok && summary ? 200 : response.status || 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-GEV-AI-Provider', provider);
    if (!response.ok) {
      console.warn(`[hud-summary] upstream HTTP ${response.status} (${provider})`);
    }
    res.end(
      JSON.stringify({
        summary: summary || null,
        provider,
        error: response.ok ? null : 'HUD summary request failed',
      }),
    );
  } catch {
    console.warn('[hud-summary] request failed');
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'HUD summary request failed' }));
  }
}

export { handleHudSummary, summarizeWithGemini, summarizeWithOpenAi };

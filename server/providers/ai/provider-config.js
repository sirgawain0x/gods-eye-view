/** @typedef {'openai' | 'google' | 'none'} HudProviderId */
/** @typedef {'openai'} VoiceProviderId */

const PROVIDER_MODES = new Set(['auto', 'openai', 'google']);

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {'auto' | 'openai' | 'google'}
 */
function readProviderMode(env = process.env) {
  const raw = String(env.GEV_AI_PROVIDER || 'auto')
    .trim()
    .toLowerCase();
  return PROVIDER_MODES.has(raw) ? raw : 'auto';
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function hasOpenAiKey(env = process.env) {
  return Boolean(String(env.OPENAI_API_KEY || '').trim());
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function hasGeminiKey(env = process.env) {
  return Boolean(
    String(env.GEMINI_API_KEY || env.GOOGLE_GENERATIVE_AI_API_KEY || '').trim(),
  );
}

/**
 * Which backend generates HUD summaries.
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ provider: HudProviderId, configured: boolean }}
 */
export function resolveHudProvider(env = process.env) {
  const mode = readProviderMode(env);
  const openai = hasOpenAiKey(env);
  const google = hasGeminiKey(env);
  if (mode === 'openai') {
    return { provider: 'openai', configured: openai };
  }
  if (mode === 'google') {
    return { provider: 'google', configured: google };
  }
  if (openai) return { provider: 'openai', configured: true };
  if (google) return { provider: 'google', configured: true };
  return { provider: 'none', configured: false };
}

/**
 * Voice uses OpenAI Realtime (WebRTC) today; Google Gemini Live is not wired yet.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveVoiceProvider(env = process.env) {
  const mode = readProviderMode(env);
  const openai = hasOpenAiKey(env);
  const google = hasGeminiKey(env);
  if (openai) {
    return {
      provider: 'openai',
      configured: true,
      hudProvider: resolveHudProvider(env).provider,
    };
  }
  return {
    provider: 'openai',
    configured: false,
    code:
      mode === 'google' && google
        ? 'VOICE_REQUIRES_OPENAI_REALTIME'
        : 'OPENAI_NOT_CONFIGURED',
    hudProvider: resolveHudProvider(env).provider,
  };
}

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
export function buildAiStatusPayload(env = process.env) {
  const hud = resolveHudProvider(env);
  const voice = resolveVoiceProvider(env);
  return {
    mode: readProviderMode(env),
    hud: {
      provider: hud.provider,
      configured: hud.configured,
    },
    voice: {
      provider: voice.provider,
      configured: voice.configured,
      ...(voice.code ? { code: voice.code } : {}),
    },
    interchangeable: {
      hud: ['openai', 'google'],
      voice: ['openai'],
    },
  };
}

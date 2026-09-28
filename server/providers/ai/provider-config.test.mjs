import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildAiStatusPayload,
  resolveHudProvider,
  resolveVoiceProvider,
} from './provider-config.js';

test('auto mode prefers OpenAI for HUD when both keys exist', () => {
  const env = {
    GEV_AI_PROVIDER: 'auto',
    OPENAI_API_KEY: 'sk-test',
    GEMINI_API_KEY: 'gem-test',
  };
  assert.deepEqual(resolveHudProvider(env), {
    provider: 'openai',
    configured: true,
  });
});

test('auto mode uses Gemini for HUD when only Gemini key is set', () => {
  const env = { GEV_AI_PROVIDER: 'auto', GEMINI_API_KEY: 'gem-test' };
  assert.deepEqual(resolveHudProvider(env), {
    provider: 'google',
    configured: true,
  });
});

test('google mode reports voice unavailable without OpenAI key', () => {
  const env = { GEV_AI_PROVIDER: 'google', GEMINI_API_KEY: 'gem-test' };
  const voice = resolveVoiceProvider(env);
  assert.equal(voice.configured, false);
  assert.equal(voice.code, 'VOICE_REQUIRES_OPENAI_REALTIME');
  assert.equal(buildAiStatusPayload(env).hud.provider, 'google');
});

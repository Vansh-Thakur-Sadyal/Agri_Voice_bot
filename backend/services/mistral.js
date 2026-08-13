// Mistral LLM service. The API key never leaves the backend.

import { buildSystemPrompt } from '../config/domain.js';

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';
const MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';

// Keep context bounded so history never grows unbounded.
const MAX_HISTORY_MESSAGES = 12;

/**
 * @param {string} userMessage
 * @param {Array<{role:string, content:string}>} history
 * @param {string} outputLangCode  language the AI should reply in
 * @returns {Promise<string>} AI response text
 */
export async function generateAIResponse(userMessage, history, outputLangCode) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    const err = new Error('MISTRAL_API_KEY is not configured on the server.');
    err.code = 'NO_MISTRAL_KEY';
    throw err;
  }

  // Sanitize + bound the incoming history.
  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (m) =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0,
        )
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }))
    : [];

  const messages = [
    { role: 'system', content: buildSystemPrompt(outputLangCode) },
    ...safeHistory,
    { role: 'user', content: String(userMessage).slice(0, 4000) },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res;
  try {
    res = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 800,
      }),
      signal: controller.signal,
    });
  } catch (e) {
    const err = new Error('Could not reach the Mistral API.');
    err.code = 'MISTRAL_NETWORK';
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    // Never leak the raw provider error / key to the client.
    const err = new Error(`Mistral API returned status ${res.status}.`);
    err.code = 'MISTRAL_HTTP';
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) {
    const err = new Error('Mistral returned an empty response.');
    err.code = 'MISTRAL_EMPTY';
    throw err;
  }
  return text;
}

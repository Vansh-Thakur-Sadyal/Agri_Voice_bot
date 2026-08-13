// Azure Speech service.
// We use the SECURE token-based approach: the permanent AZURE_SPEECH_KEY stays on
// the backend. The browser only receives a SHORT-LIVED token (valid ~10 min) that
// the Speech SDK uses for STT and TTS. The key is never exposed to the frontend.

/**
 * Exchange the permanent Speech key for a short-lived authorization token.
 * @returns {Promise<{token:string, region:string}>}
 */
export async function issueSpeechToken() {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    const err = new Error('Azure Speech credentials are not configured on the server.');
    err.code = 'NO_AZURE_CREDS';
    throw err;
  }

  const url = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Length': '0',
      },
      signal: controller.signal,
    });
  } catch (e) {
    const err = new Error('Could not reach the Azure token service.');
    err.code = 'AZURE_NETWORK';
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const err = new Error(`Azure token service returned status ${res.status}.`);
    err.code = 'AZURE_HTTP';
    err.status = res.status;
    throw err;
  }

  const token = await res.text();
  return { token, region };
}

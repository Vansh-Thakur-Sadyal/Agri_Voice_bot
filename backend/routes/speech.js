import { Router } from 'express';
import { issueSpeechToken } from '../services/azureSpeech.js';
import { publicLanguageList } from '../config/languages.js';

const router = Router();

// Key-free language list for the frontend UI.
router.get('/languages', (req, res) => {
  res.json({ languages: publicLanguageList() });
});

// Short-lived Azure Speech token for the browser SDK (STT + TTS).
router.get('/token', async (req, res) => {
  try {
    const { token, region } = await issueSpeechToken();
    res.json({ token, region });
  } catch (err) {
    console.error('[speech/token]', err.code || err.message);
    res.status(503).json({
      error: 'speech_unavailable',
      message: 'Voice service is unavailable right now. Please try again shortly.',
    });
  }
});

export default router;

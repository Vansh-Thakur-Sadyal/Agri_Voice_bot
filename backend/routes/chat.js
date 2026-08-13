import { Router } from 'express';
import { generateAIResponse } from '../services/mistral.js';
import { isSupportedLanguage, getVoice } from '../config/languages.js';

const router = Router();

// POST /api/chat
// body: { message, history, outputLang, voiceGender }
router.post('/', async (req, res) => {
  const { message, history, outputLang, voiceGender } = req.body || {};

  if (typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'empty_message', message: 'No text was provided.' });
  }

  // Never trust the language coming from the client — validate against config.
  if (!isSupportedLanguage(outputLang)) {
    return res
      .status(400)
      .json({ error: 'bad_language', message: 'Unsupported language selected.' });
  }

  const gender = voiceGender === 'male' ? 'male' : 'female';

  try {
    const reply = await generateAIResponse(message.trim(), history, outputLang);
    res.json({
      reply,
      voice: getVoice(outputLang, gender), // tell the client which neural voice to speak with
    });
  } catch (err) {
    console.error('[chat]', err.code || err.message);
    const friendly =
      err.code === 'NO_MISTRAL_KEY'
        ? 'The AI service is not configured yet. Please add the Mistral API key.'
        : "I'm having trouble generating a response right now. Please try again.";
    res.status(503).json({ error: 'llm_unavailable', message: friendly });
  }
});

export default router;

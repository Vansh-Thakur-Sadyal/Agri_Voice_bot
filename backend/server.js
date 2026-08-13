import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import chatRouter from './routes/chat.js';
import speechRouter from './routes/speech.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '64kb' }));

// Reasonable request limits so the APIs aren't abused.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many requests. Please slow down.' },
});
app.use('/api/', apiLimiter);

// API routes
app.use('/api/chat', chatRouter);
app.use('/api/speech', speechRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    mistral: Boolean(process.env.MISTRAL_API_KEY),
    azure: Boolean(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION),
  });
});

// Serve the frontend
const publicDir = join(__dirname, '..', 'frontend');
app.use(express.static(publicDir));
app.get('*', (req, res) => res.sendFile(join(publicDir, 'index.html')));

app.listen(PORT, () => {
  console.log(`\n  🌾🩺  Voice Agent running:  http://localhost:${PORT}`);
  console.log(`  Mistral key: ${process.env.MISTRAL_API_KEY ? 'set' : 'MISSING'}`);
  console.log(
    `  Azure Speech: ${
      process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION ? 'set' : 'MISSING'
    }\n`,
  );
});

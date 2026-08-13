# Agri Voice Bot

A multilingual voice assistant focused on agricultural (and optional healthcare) guidance.

This repository contains a small Express backend and a static frontend that together provide:
- Browser-based Azure Speech SDK integration for real-time STT/TTS
- Backend LLM calls to Mistral (or a configurable provider)
- Language configuration and neural voice mapping for multiple Indian languages

---

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Create a local `.env` file (not checked into git). See **Environment variables** below.

3. Run the server

```bash
npm start
```

4. Open the frontend in your browser:

		http://localhost:3000

---

## Environment variables

Create a `.env` file at the repository root with the following variables (example values shown):

- `AZURE_SPEECH_KEY` — your Azure Speech subscription key
- `AZURE_SPEECH_REGION` — Azure region (e.g. `centralindia` or `eastus`)
- `MISTRAL_API_KEY` — API key for Mistral (or other LLM provider)
- `MISTRAL_MODEL` — model name to use (e.g. `mistral-small-latest`)
- `PORT` — optional server port (defaults to `3000`)

Notes:
- API keys are intentionally excluded from the repo — use your own keys.
- The backend issues short-lived Azure tokens for the browser; the permanent Azure key remains on the server.

---

## Project layout

- `backend/`
	- `server.js` — Express server entry
	- `routes/chat.js` — handles LLM chat requests
	- `routes/speech.js` — issues Azure STS tokens and language lists
	- `services/azureSpeech.js` — helper to request Azure TTS/STT tokens (server-side)
	- `services/mistral.js` — LLM API integration
	- `config/` — `domain.js`, `languages.js` for system prompts and locale/voice mapping
- `frontend/` — static UI served by the backend
	- `index.html`, `app.js`, `config.js`, `styles.css`

---

## How it works (high level)

1. Browser requests a short-lived Azure Speech token from the backend (`/api/speech/token`).
2. The browser uses Azure Speech SDK (STT/TTS) directly with that token.
3. When user speech is transcribed, the frontend POSTs text to `/api/chat`.
4. Backend calls the configured LLM (Mistral) and returns response text + selected voice.
5. Frontend invokes Azure TTS to speak the response.

Security: permanent API keys never leave the backend. The browser only sees a short-lived Azure token.

---

## Routes and usage

- `GET /api/speech/languages` — returns supported language list + voice mapping for the UI
- `GET /api/speech/token` — issues a short-lived Azure Speech token for the browser SDK
- `POST /api/chat` — send a user message; backend forwards to LLM and returns a reply and recommended voice
- `GET /api/health` — (optional) checks whether API keys are configured

Example `POST /api/chat` payload:

```json
{ "message": "My wheat leaves are turning yellow, what should I do?", "context": [] }
```

Response:

```json
{ "reply": "Check soil nitrogen and irrigation; consider ...", "voice": { "locale": "hi-IN", "name": "SwaraNeural" } }
```

---

## Development notes

- To change language/voice mapping edit `[backend]/config/languages.js`.
- To modify the assistant system prompt or domain restrictions edit `[backend]/config/domain.js`.
- LLM integration: `backend/services/mistral.js` — replace or extend this file to integrate other providers.

---

## Testing

- Manual: run locally and test the microphone flow in the browser. Microphone access requires `http://localhost` or HTTPS.
- Unit/Integration: add tests around `services/` and `routes/` (no tests included by default).

---

## Deployment

- Provide production environment variables (same keys as `.env`) on your host.
- Serve the app behind HTTPS (required for microphone access on remote hosts).
- Optional: containerize with Docker (not included here) — ensure secrets are supplied via secure environment variables or secret manager.

---

## Contributing

- Please open issues or PRs on GitHub. Keep API keys and secrets out of commits.

---

## Troubleshooting

- If speech token requests fail, confirm `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are correct.
- If LLM calls fail, verify `MISTRAL_API_KEY` and the `MISTRAL_MODEL` setting.

---

## License
This project is licensed under the Apache License 2.0 — see the `LICENSE` file for details.

---

If you want, I can also add a minimal `.env.example` and update `frontend/config.js` to document public-facing config.


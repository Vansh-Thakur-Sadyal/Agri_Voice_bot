# Agri Voice Bot

Agri Voice Bot is a lightweight voice agent for agricultural assistance using Azure Speech and Mistral LLM.

## Features
- Speech-to-text and text-to-speech via Azure Speech Services
- LLM responses powered by Mistral (or another configured provider)
- Simple Express backend and browser frontend

## Requirements
- Node.js (16+ recommended)
- An Azure Speech resource (key + region)
- A Mistral API key (or other LLM provider)

## Setup
1. Install dependencies:

```
npm install
```

2. Create a `.env` file in the project root with your keys (example below). Note: API keys are NOT included in the repository — use your own.

Example `.env` variables:

- `AZURE_SPEECH_KEY` — your Azure Speech API key
- `AZURE_SPEECH_REGION` — Azure region (e.g. `eastus`)
- `MISTRAL_API_KEY` — your Mistral LLM API key
- Any other keys required by `backend/config` or `services`

3. Start the app:

```
npm start
```

## Project Structure

- `backend/` — Express server, routes and services
- `frontend/` — static frontend (HTML, JS, CSS)

## Notes on API keys
- This repository does NOT include any API keys or secrets.
- Provide your own keys via a `.env` file or environment variables.
- Default services used: Azure Speech (speech) and Mistral (LLM). Replace these providers in `services/` if you prefer alternatives.

## License
This project is licensed under the Apache License 2.0 — see the `LICENSE` file for details.
# 🌾🩺 Kisan-Swasthya Sahayak — Multilingual Indian Voice Assistant

A voice chatbot for **Agriculture** and **Healthcare** in 13 Indian languages.
Speak → **Azure Speech-to-Text** → **Mistral** (reasoning) → **Azure Text-to-Speech** → hear the answer.

The assistant is **strictly limited** to farming/agriculture and health topics and
politely refuses anything else — in the user's own language.

## ✨ Features

- 13 languages: Hindi, Bengali, Marathi, Gujarati, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, English (India)
- **Microphone picker** — choose any attached input device
- **Answer-language option** — speak in English (or any language) and get the reply in a *different* language, or keep input = output
- Same-language input & output by default (no wasteful English round-trip)
- Male / female neural voice choice
- Conversation memory for follow-up questions
- Secure: API keys stay on the backend; the browser only gets a short-lived Azure token
- Friendly error handling for mic denial, empty speech, network/API failures

## 🧱 Architecture

```
Browser (mic + Azure Speech SDK)
        │  short-lived token
        ▼
   Express backend  ──►  Mistral API   (LLM, key hidden)
        │            └►  Azure token   (STT + TTS auth, key hidden)
        ▼
Azure Speech STT / TTS  ◄─ browser SDK uses the token directly
```

- **Speech-to-Text** and **Text-to-Speech** run in the browser via the Azure Speech SDK using a **token** the backend issues (`POST /sts/v1.0/issueToken`). The permanent `AZURE_SPEECH_KEY` is never sent to the browser.
- **Mistral** is called only from the backend.

### Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/speech/languages` | key-free language list for the UI |
| GET | `/api/speech/token` | short-lived Azure Speech token |
| POST | `/api/chat` | Mistral reply + the neural voice to speak it |
| GET | `/api/health` | shows whether keys are configured |

## 📁 Project structure

```
voice agent/
├── backend/
│   ├── config/
│   │   ├── languages.js     # single source of truth: locales + neural voices
│   │   └── domain.js        # agriculture+healthcare system prompt
│   ├── routes/
│   │   ├── chat.js
│   │   └── speech.js
│   ├── services/
│   │   ├── mistral.js
│   │   └── azureSpeech.js
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── config.js            # NO keys
│   └── app.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Setup

### 1. Get an Azure Speech resource
1. Create/sign in to an **Azure account** at https://portal.azure.com
2. Create a **Speech service** resource (the free **F0** tier works for testing).
3. Open the resource → **Keys and Endpoint** → copy **KEY 1** and the **Region** (e.g. `centralindia`, `eastus`).

> Free **F0** limits (subject to change): TTS ≈ 0.5M characters/month, STT ≈ 5 audio hours/month, 1 concurrent request. Fine for a prototype.

### 2. Get a Mistral API key
1. Sign in at https://console.mistral.ai
2. Create an **API key** and copy it.

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
MISTRAL_API_KEY=your_mistral_key
MISTRAL_MODEL=mistral-small-latest
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=your_region      # e.g. centralindia
PORT=3000
```

### 4. Install & run
```bash
npm install
npm start
```
Open **http://localhost:3000**

> Microphone access requires `http://localhost` or HTTPS — both are allowed by browsers.

### 5. Use it
1. Pick a language card
2. Choose your **microphone**, **answer language**, and **voice**
3. **Continue →**
4. Tap the mic, speak an **agriculture or health** question, and listen to the reply

## 🗣 Language ↔ Azure voice map (verified)

| Language | Locale | Female voice | Male voice |
|----------|--------|--------------|------------|
| Hindi | hi-IN | SwaraNeural | MadhurNeural |
| Bengali | bn-IN | TanishaaNeural | BashkarNeural |
| Marathi | mr-IN | AarohiNeural | ManoharNeural |
| Gujarati | gu-IN | DhwaniNeural | NiranjanNeural |
| Tamil | ta-IN | PallaviNeural | ValluvarNeural |
| Telugu | te-IN | ShrutiNeural | MohanNeural |
| Kannada | kn-IN | SapnaNeural | GaganNeural |
| Malayalam | ml-IN | SobhanaNeural | MidhunNeural |
| Punjabi | pa-IN | VaaniNeural | OjasNeural |
| Odia | or-IN | SubhasiniNeural | SukantNeural |
| Assamese | as-IN | YashicaNeural | PriyomNeural |
| Urdu | ur-IN | GulNeural | SalmanNeural |
| English (India) | en-IN | NeerjaNeural | PrabhatNeural |

## ✅ Testing checklist
- Hindi: `नमस्ते, मेरी गेहूँ की फसल में पीले पत्ते आ रहे हैं, क्या करूँ?`
- Tamil: `வணக்கம், எனக்கு காய்ச்சல் இருக்கிறது, என்ன செய்ய வேண்டும்?`
- Telugu: `నమస్కారం, వరి పంటకు ఏ ఎరువు మంచిది?`
- English input → Marathi answer (set answer-language to Marathi)
- Off-topic (e.g. cricket score) → assistant should politely refuse
- Follow-up question uses previous context
- Test: empty audio, mic permission denied, switching languages, clear conversation

## 🔒 Security notes
- `MISTRAL_API_KEY` and `AZURE_SPEECH_KEY` are **never** in frontend code.
- Browser receives only a short-lived Azure token (~10 min).
- Language values from the client are validated against the config.
- Rate limiting (40 req/min) and request size limits are enabled.
- `.env` is git-ignored.

## ⚠️ Notes
- This tool gives general information only. It is **not** a substitute for a doctor or an agricultural expert. For emergencies, consult a professional.

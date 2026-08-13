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


/* Kisan-Swasthya Voice Assistant — frontend logic.
 * Pipeline:  mic → Azure STT (browser SDK + backend token) → /api/chat (Mistral)
 *            → Azure TTS (browser SDK) → audio playback.
 */
(() => {
  const SDK = window.SpeechSDK;
  const cfg = window.APP_CONFIG;

  // ---------- state ----------
  const state = {
    languages: [],        // [{code, locale, name, native}]
    inputLang: null,      // code the user speaks in
    outputMode: 'same',   // 'same' or a language code
    voiceGender: 'female',
    micDeviceId: null,
    history: [],          // [{role, content}]
    token: null,
    tokenAt: 0,
    recognizer: null,
    synthesizer: null,
    player: null,
    busy: false,          // true during processing/thinking/speaking
    recording: false,
  };

  // ---------- element refs ----------
  const $ = (id) => document.getElementById(id);
  const el = {
    screenSelect: $('screen-select'),
    screenChat: $('screen-chat'),
    langGrid: $('lang-grid'),
    micSelect: $('mic-select'),
    outputLang: $('output-lang'),
    voiceGender: $('voice-gender'),
    continueBtn: $('continue-btn'),
    inputSwitch: $('input-switch'),
    outputSwitch: $('output-switch'),
    clearBtn: $('clear-btn'),
    messages: $('messages'),
    errorBar: $('error-bar'),
    statusPill: $('status-pill'),
    micBtn: $('mic-btn'),
    micCaption: $('mic-caption'),
    welcomeBubble: $('welcome-bubble'),
  };

  // ================= init =================
  init();

  async function init() {
    if (!SDK) {
      showFatal('Voice engine could not load. Check your internet connection and reload.');
    }
    await loadLanguages();
    await loadMicrophones();
    wireEvents();
  }

  async function loadLanguages() {
    try {
      const res = await fetch(`${cfg.API_BASE}/api/speech/languages`);
      const data = await res.json();
      state.languages = data.languages || [];
    } catch {
      showFatal('Could not load the app configuration. Is the server running?');
      return;
    }

    // Every language is available as an input card...
    renderLangCards();

    // ...and every language is available in every selector, so the user can pick
    // the same language for input & output, or two different ones.
    el.outputSwitch.appendChild(new Option('Same as I speak', 'same'));
    state.languages.forEach((lang) => {
      const label = `${lang.native} — ${lang.name}`;
      el.outputLang.appendChild(new Option(label, lang.code)); // home: answer language
      el.inputSwitch.appendChild(new Option(label, lang.code)); // chat: input language
      el.outputSwitch.appendChild(new Option(label, lang.code)); // chat: answer language
    });
  }

  // Render all language cards (input language the user will speak).
  function renderLangCards() {
    el.langGrid.innerHTML = '';
    state.languages.forEach((lang) => {
      const card = document.createElement('button');
      card.className = 'lang-card';
      card.dataset.code = lang.code;
      if (lang.code === state.inputLang) card.classList.add('selected');
      card.innerHTML = `<div class="native">${lang.native}</div><div class="name">${lang.name}</div>`;
      card.addEventListener('click', () => selectLanguage(lang.code));
      el.langGrid.appendChild(card);
    });
  }

  async function loadMicrophones() {
    try {
      // Prompt once so device labels become available.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      el.micSelect.innerHTML = '<option value="">Microphone blocked</option>';
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((d) => d.kind === 'audioinput');
      el.micSelect.innerHTML = '';
      if (mics.length === 0) {
        el.micSelect.appendChild(new Option('No microphone found', ''));
        return;
      }
      mics.forEach((m, i) =>
        el.micSelect.appendChild(new Option(m.label || `Microphone ${i + 1}`, m.deviceId)),
      );
      state.micDeviceId = mics[0].deviceId;
    } catch {
      el.micSelect.innerHTML = '<option value="">Default microphone</option>';
    }
  }

  function wireEvents() {
    el.micSelect.addEventListener('change', (e) => (state.micDeviceId = e.target.value));
    el.outputLang.addEventListener('change', (e) => (state.outputMode = e.target.value));
    el.voiceGender.addEventListener('change', (e) => (state.voiceGender = e.target.value));
    el.continueBtn.addEventListener('click', goToChat);
    el.clearBtn.addEventListener('click', clearConversation);
    el.micBtn.addEventListener('click', onMicClick);
    el.inputSwitch.addEventListener('change', (e) => {
      state.inputLang = e.target.value;
      resetSpeechClients();
    });
    el.outputSwitch.addEventListener('change', (e) => {
      state.outputMode = e.target.value;
    });
  }

  function selectLanguage(code) {
    state.inputLang = code;
    [...el.langGrid.children].forEach((c) =>
      c.classList.toggle('selected', c.dataset.code === code),
    );
    el.continueBtn.disabled = false;
  }

  function goToChat() {
    if (!state.inputLang) return;
    // Carry the home-screen choices into the two chat bars.
    el.inputSwitch.value = state.inputLang;
    el.outputSwitch.value = state.outputMode;
    el.screenSelect.classList.remove('active');
    el.screenChat.classList.add('active');
  }

  // ================= mic / pipeline =================
  function onMicClick() {
    if (state.busy) return;
    if (state.recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function outputLangCode() {
    return state.outputMode === 'same' ? state.inputLang : state.outputMode;
  }

  async function ensureToken() {
    const fresh = state.token && Date.now() - state.tokenAt < cfg.TOKEN_TTL_MS;
    if (fresh) return state.token;
    const res = await fetch(`${cfg.API_BASE}/api/speech/token`);
    if (!res.ok) throw new Error('token');
    const data = await res.json();
    state.token = data;
    state.tokenAt = Date.now();
    return data;
  }

  async function startRecording() {
    clearError();
    stopPlayback();
    let token;
    try {
      token = await ensureToken();
    } catch {
      return showError('Voice service is unavailable. Please try again shortly.');
    }

    const lang = state.languages.find((l) => l.code === state.inputLang);
    const speechConfig = SDK.SpeechConfig.fromAuthorizationToken(token.token, token.region);
    speechConfig.speechRecognitionLanguage = lang.locale;

    const audioConfig = state.micDeviceId
      ? SDK.AudioConfig.fromMicrophoneInput(state.micDeviceId)
      : SDK.AudioConfig.fromDefaultMicrophoneInput();

    try {
      state.recognizer = new SDK.SpeechRecognizer(speechConfig, audioConfig);
    } catch {
      return showError('Could not access the selected microphone. Choose another one.');
    }

    setRecording(true);
    setStatus('listening', cfg.UI_TEXT.listening[state.inputLang] || 'Listening…');

    state.recognizer.recognizeOnceAsync(
      (result) => {
        setRecording(false);
        handleRecognition(result);
      },
      (err) => {
        setRecording(false);
        cleanupRecognizer();
        showError('Speech recognition failed. Please try again.');
        setStatus('ready', 'Ready');
      },
    );
  }

  function stopRecording() {
    if (state.recognizer) {
      try {
        state.recognizer.stopContinuousRecognitionAsync?.();
      } catch {}
    }
    // recognizeOnceAsync resolves on silence; this button press just reflects intent.
    setRecording(false);
    setStatus('processing', 'Processing…');
  }

  async function handleRecognition(result) {
    cleanupRecognizer();
    const R = SDK.ResultReason;
    if (result.reason === R.RecognizedSpeech && result.text.trim()) {
      const text = result.text.trim();
      addMessage('user', text);
      await askAI(text);
    } else if (result.reason === R.NoMatch) {
      showError("I couldn't understand the audio. Please try speaking again.");
      setStatus('ready', 'Ready');
    } else {
      showError('Speech recognition failed. Please try again.');
      setStatus('ready', 'Ready');
    }
  }

  async function askAI(text) {
    state.busy = true;
    setStatus('thinking', 'AI thinking…');
    const typing = addTyping();

    let data;
    try {
      const res = await fetch(`${cfg.API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: state.history,
          outputLang: outputLangCode(),
          voiceGender: state.voiceGender,
        }),
      });
      data = await res.json();
      if (!res.ok) throw new Error(data.message || 'chat');
    } catch (e) {
      typing.remove();
      state.busy = false;
      setStatus('ready', 'Ready');
      return showError(e.message || 'Please check your internet connection and try again.');
    }

    typing.remove();
    addMessage('assistant', data.reply);
    state.history.push({ role: 'user', content: text });
    state.history.push({ role: 'assistant', content: data.reply });
    // keep client history bounded too
    if (state.history.length > 16) state.history = state.history.slice(-16);

    await speak(data.reply, data.voice);
    state.busy = false;
    setStatus('ready', 'Ready');
  }

  // ================= TTS =================
  async function speak(text, voiceName) {
    let token;
    try {
      token = await ensureToken();
    } catch {
      return showError('I generated the response, but I could not play the voice right now.');
    }
    stopPlayback();

    const speechConfig = SDK.SpeechConfig.fromAuthorizationToken(token.token, token.region);
    speechConfig.speechSynthesisVoiceName = voiceName;

    state.player = new SDK.SpeakerAudioDestination();
    const audioConfig = SDK.AudioConfig.fromSpeakerOutput(state.player);
    state.synthesizer = new SDK.SpeechSynthesizer(speechConfig, audioConfig);

    setStatus('speaking', '🔊 AI speaking…');

    await new Promise((resolve) => {
      state.player.onAudioEnd = () => resolve();
      state.synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason !== SDK.ResultReason.SynthesizingAudioCompleted) resolve();
          cleanupSynth();
        },
        () => {
          showError('I generated the response, but I could not play the voice right now.');
          cleanupSynth();
          resolve();
        },
      );
    });
  }

  function stopPlayback() {
    if (state.player) {
      try { state.player.pause(); } catch {}
    }
    cleanupSynth();
  }

  // ================= UI helpers =================
  function addMessage(role, text) {
    if (el.welcomeBubble) { el.welcomeBubble.parentElement.remove(); el.welcomeBubble = null; }
    const wrap = document.createElement('div');
    wrap.className = `msg ${role === 'user' ? 'user' : 'ai'}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    el.messages.appendChild(wrap);
    el.messages.scrollTop = el.messages.scrollHeight;
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement('div');
    wrap.className = 'msg ai typing';
    wrap.innerHTML = '<div class="bubble">…</div>';
    el.messages.appendChild(wrap);
    el.messages.scrollTop = el.messages.scrollHeight;
    return wrap;
  }

  function setStatus(kind, label) {
    el.statusPill.className = `status-pill ${kind}`;
    el.statusPill.textContent = label;
    el.micBtn.disabled = kind !== 'ready' && kind !== 'listening';
    if (kind === 'ready') el.micCaption.textContent = 'Tap to speak';
    else if (kind === 'listening') el.micCaption.textContent = 'Tap to stop';
    else el.micCaption.textContent = label;
  }

  function setRecording(on) {
    state.recording = on;
    el.micBtn.classList.toggle('recording', on);
  }

  function showError(msg) {
    el.errorBar.textContent = msg;
    el.errorBar.classList.remove('hidden');
    setTimeout(() => el.errorBar.classList.add('hidden'), 6000);
  }
  function clearError() { el.errorBar.classList.add('hidden'); }

  function showFatal(msg) {
    document.body.innerHTML =
      `<div style="min-height:100vh;display:grid;place-items:center;padding:24px;text-align:center;color:#eaf3ee;font-family:system-ui">${msg}</div>`;
  }

  function clearConversation() {
    state.history = [];
    stopPlayback();
    el.messages.innerHTML =
      '<div class="msg ai"><div class="bubble">Conversation cleared. Ask me about farming or health.</div></div>';
    setStatus('ready', 'Ready');
  }

  // ================= cleanup =================
  function cleanupRecognizer() {
    if (state.recognizer) {
      try { state.recognizer.close(); } catch {}
      state.recognizer = null;
    }
  }
  function cleanupSynth() {
    if (state.synthesizer) {
      try { state.synthesizer.close(); } catch {}
      state.synthesizer = null;
    }
  }
  function resetSpeechClients() {
    cleanupRecognizer();
    cleanupSynth();
  }
})();

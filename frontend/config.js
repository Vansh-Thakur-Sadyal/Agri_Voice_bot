// Frontend config. NO API KEYS here — the browser only talks to our backend.
window.APP_CONFIG = {
  API_BASE: '', // same origin
  // How long before a fetched Azure token is considered stale (Azure tokens last ~10 min).
  TOKEN_TTL_MS: 8 * 60 * 1000,
  // Localised UI strings for the few messages we show in the selected language.
  UI_TEXT: {
    listening: {
      en: 'Listening…', hi: 'सुन रहा हूँ…', bn: 'শুনছি…', mr: 'ऐकत आहे…', gu: 'સાંભળી રહ્યો છું…',
      ta: 'கேட்கிறேன்…', te: 'వింటున్నాను…', kn: 'ಕೇಳುತ್ತಿದ್ದೇನೆ…', ml: 'കേൾക്കുന്നു…',
      pa: 'ਸੁਣ ਰਿਹਾ ਹਾਂ…', or: 'ଶୁଣୁଛି…', as: 'শুনি আছোঁ…', ur: 'سن رہا ہوں…',
    },
  },
};

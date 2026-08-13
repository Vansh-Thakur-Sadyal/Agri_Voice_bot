// Central language configuration — the single source of truth.
// Locales and neural voice names are VERIFIED against the official Azure
// Speech "Language and voice support" documentation (Aug 2026).
// Do NOT scatter these codes elsewhere in the app; always import from here.

export const LANGUAGES = {
  hi: {
    code: 'hi',
    locale: 'hi-IN',
    name: 'Hindi',
    native: 'हिन्दी',
    voices: { female: 'hi-IN-SwaraNeural', male: 'hi-IN-MadhurNeural' },
  },
  bn: {
    code: 'bn',
    locale: 'bn-IN',
    name: 'Bengali',
    native: 'বাংলা',
    voices: { female: 'bn-IN-TanishaaNeural', male: 'bn-IN-BashkarNeural' },
  },
  mr: {
    code: 'mr',
    locale: 'mr-IN',
    name: 'Marathi',
    native: 'मराठी',
    voices: { female: 'mr-IN-AarohiNeural', male: 'mr-IN-ManoharNeural' },
  },
  gu: {
    code: 'gu',
    locale: 'gu-IN',
    name: 'Gujarati',
    native: 'ગુજરાતી',
    voices: { female: 'gu-IN-DhwaniNeural', male: 'gu-IN-NiranjanNeural' },
  },
  ta: {
    code: 'ta',
    locale: 'ta-IN',
    name: 'Tamil',
    native: 'தமிழ்',
    voices: { female: 'ta-IN-PallaviNeural', male: 'ta-IN-ValluvarNeural' },
  },
  te: {
    code: 'te',
    locale: 'te-IN',
    name: 'Telugu',
    native: 'తెలుగు',
    voices: { female: 'te-IN-ShrutiNeural', male: 'te-IN-MohanNeural' },
  },
  kn: {
    code: 'kn',
    locale: 'kn-IN',
    name: 'Kannada',
    native: 'ಕನ್ನಡ',
    voices: { female: 'kn-IN-SapnaNeural', male: 'kn-IN-GaganNeural' },
  },
  ml: {
    code: 'ml',
    locale: 'ml-IN',
    name: 'Malayalam',
    native: 'മലയാളം',
    voices: { female: 'ml-IN-SobhanaNeural', male: 'ml-IN-MidhunNeural' },
  },
  pa: {
    code: 'pa',
    locale: 'pa-IN',
    name: 'Punjabi',
    native: 'ਪੰਜਾਬੀ',
    voices: { female: 'pa-IN-VaaniNeural', male: 'pa-IN-OjasNeural' },
  },
  or: {
    code: 'or',
    locale: 'or-IN',
    name: 'Odia',
    native: 'ଓଡ଼ିଆ',
    voices: { female: 'or-IN-SubhasiniNeural', male: 'or-IN-SukantNeural' },
  },
  as: {
    code: 'as',
    locale: 'as-IN',
    name: 'Assamese',
    native: 'অসমীয়া',
    voices: { female: 'as-IN-YashicaNeural', male: 'as-IN-PriyomNeural' },
  },
  ur: {
    code: 'ur',
    locale: 'ur-IN',
    name: 'Urdu',
    native: 'اردو',
    voices: { female: 'ur-IN-GulNeural', male: 'ur-IN-SalmanNeural' },
  },
  en: {
    code: 'en',
    locale: 'en-IN',
    name: 'English',
    native: 'English',
    group: 'other',
    voices: { female: 'en-IN-NeerjaNeural', male: 'en-IN-PrabhatNeural' },
  },
};

// Every language is "indian" unless it explicitly sets group: 'other'.
for (const lang of Object.values(LANGUAGES)) {
  if (!lang.group) lang.group = 'indian';
}

export const DEFAULT_LANGUAGE = 'hi';

/** Validate an untrusted language code coming from the client. */
export function isSupportedLanguage(code) {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(LANGUAGES, code);
}

export function getLanguage(code) {
  return LANGUAGES[code] || null;
}

/** Pick a neural voice for a language + gender, with a safe fallback. */
export function getVoice(code, gender = 'female') {
  const lang = getLanguage(code);
  if (!lang) return null;
  return lang.voices[gender] || lang.voices.female;
}

/** Slim, key-free list safe to send to the browser. */
export function publicLanguageList() {
  return Object.values(LANGUAGES).map(({ code, locale, name, native, group }) => ({
    code,
    locale,
    name,
    native,
    group,
  }));
}

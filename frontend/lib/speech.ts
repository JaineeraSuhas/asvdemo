export interface SpeechSettings {
  enabled: boolean;
  voiceName: string; // Empty string means browser/OS default
  rate: number;      // Speed: 0.1 to 10 (reasonable range is 0.5 to 2.0)
  pitch: number;     // Pitch: 0 to 2
  volume: number;    // Volume: 0 to 1
}

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  enabled: true,
  voiceName: "",
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

/**
 * Load settings from localStorage with safe fallback.
 */
export function getSpeechSettings(): SpeechSettings {
  if (typeof window === "undefined") return DEFAULT_SPEECH_SETTINGS;
  try {
    const stored = localStorage.getItem("asv_speech_settings");
    if (stored) {
      return { ...DEFAULT_SPEECH_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Error reading speech settings from localStorage:", e);
  }
  return DEFAULT_SPEECH_SETTINGS;
}

/**
 * Save settings to localStorage.
 */
export function saveSpeechSettings(settings: SpeechSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("asv_speech_settings", JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving speech settings to localStorage:", e);
  }
}

/**
 * Speaks the given text aloud using the browser's native text-to-speech engine.
 */
export function speakWord(text: string, settings: SpeechSettings = getSpeechSettings()) {
  if (!settings.enabled) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return;
  }

  // Cancel any speech currently playing to avoid overlapping utterances
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;

  // Use the requested voice if specified
  if (settings.voiceName) {
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.name === settings.voiceName);
    if (voice) {
      utterance.voice = voice;
    }
  }

  window.speechSynthesis.speak(utterance);
}

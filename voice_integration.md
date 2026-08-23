# ASV (A Silent Voice) — Speech Synthesis (Text-to-Speech) Integration Guide

This guide explains how to integrate real-time Text-to-Speech (TTS) into the ASV React application. When the silent speech classifier identifies a word from the EMG signals, the browser will vocalize the word immediately.

---

## 1. Core Technology: Web Speech API

The easiest, most responsive, and zero-dependency way to add voice to a web application is the built-in browser **Web Speech API** (specifically, the `SpeechSynthesis` interface). It is supported natively on:
* iOS (Safari, Chrome)
* Android (Chrome)
* Desktop browsers (Chrome, Edge, Safari, Firefox)

---

## 2. Step-by-Step Integration

### Step A: Create a Voice Utility Function
Add this lightweight helper function inside a new file `frontend/lib/speech.ts` (or directly inside the component):

```typescript
/**
 * Speaks the given text aloud using the browser's native text-to-speech engine.
 * Falls back gracefully if SpeechSynthesis is not supported.
 */
export function speakWord(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis not supported in this browser.");
    return;
  }

  // Cancel any speech currently playing to avoid overlap
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Customise speech settings (optional)
  utterance.rate = 1.0;  // Speed: 0.1 to 10
  utterance.pitch = 1.0; // Pitch: 0 to 2
  utterance.volume = 1.0; // Volume: 0 to 1

  // Use the default system voice
  window.speechSynthesis.speak(utterance);
}
```

### Step B: Trigger Speech on Classification
In `frontend/components/asv/live-detection.tsx`, import `speakWord` and invoke it as soon as a prediction is successfully returned:

#### Inside USB serial live capture (`captureAndClassify`):
```typescript
const p = await asvApi.predictUtterance(samples, model?.sampling_rate);
const r: Result = {
  envelope: liveWave,
  prediction: p.prediction,
  confidence: p.confidence,
  ranking: p.ranking,
};
setResult(r);

if (p.prediction) {
  // Vocalize the classified word!
  speakWord(p.prediction);
  
  onAddHistory({
    word: p.prediction,
    confidence: p.confidence,
    timestamp: new Date(),
    ranking: p.ranking,
  });
}
```

#### Inside Demo/Replay mode (`classifyReplay`):
```typescript
const d = await asvApi.demoRecording(subjName, word, repName);
const r: Result = {
  envelope: d.envelope_mv,
  prediction: d.prediction,
  confidence: d.confidence,
  ranking: d.ranking,
  trueLabel: d.true_label,
};
setResult(r);

if (d.prediction) {
  // Vocalize the classified word!
  speakWord(d.prediction);
  
  onAddHistory({
    word: d.prediction,
    confidence: d.confidence,
    timestamp: new Date(),
    ranking: d.ranking,
  });
}
```

---

## 3. Best Practices & Notes

1. **User Gesture Requirement**: Most mobile browsers (especially iOS Safari) block programmatic audio playback until the user interacts with the page (e.g. clicks a button). Since the classification is triggered by the user tapping the "CAPTURE" button or selecting a word in Demo mode, this user gesture is already satisfied.
2. **Offline Support**: The Web Speech API uses local system voices built into the mobile OS (Siri voices on iOS, Google TTS voices on Android), so it works 100% offline without needing internet access or API keys.

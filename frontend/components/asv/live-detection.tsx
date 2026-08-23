"use client"

/**
 * LiveDetection — Tactical Monochrome & Brutalist Interface.
 * Non-scrolling static layout fitting 100% in viewport.
 */
import { motion, AnimatePresence } from "framer-motion"
import { Activity, History, Usb, Loader2, Check, X, WifiOff, Bluetooth, LogOut, RefreshCw, Volume2, VolumeX, Sliders } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { asvApi, type ModelStatus, type RecordingRef, type Ranking } from "@/lib/asv-api"
import { useWebSerial } from "@/hooks/use-web-serial"
import { useBLE } from "@/hooks/use-ble"
import type { HistoryEntry } from "./word-history"
import { speakWord, getSpeechSettings, saveSpeechSettings, type SpeechSettings } from "@/lib/speech"

type Transport = "ble" | "usb" | "demo"

interface LiveDetectionProps {
  mode: "live" | "replay"
  transport: Transport
  serial?: ReturnType<typeof useWebSerial>
  ble?: ReturnType<typeof useBLE>
  onNavigateHistory: () => void
  onAddHistory: (entry: HistoryEntry) => void
  onDisconnect: () => void
}

interface Result {
  envelope: number[]
  prediction: string | null
  confidence: number
  ranking: Ranking[]
  trueLabel?: string
}

const BAR_COUNT = 44
const FALLBACK_BARS = Array.from({ length: BAR_COUNT }, () => 3)

function toBars(arr: number[], n = BAR_COUNT): number[] {
  if (!arr.length) return FALLBACK_BARS
  if (arr.length <= n) {
    const out = Array(n).fill(3)
    arr.forEach((v, i) => { out[n - arr.length + i] = v })
    return out
  }
  const out: number[] = []
  const size = arr.length / n
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * size)
    const b = Math.max(a + 1, Math.floor((i + 1) * size))
    let m = 0
    for (let j = a; j < b && j < arr.length; j++) m = Math.max(m, Math.abs(arr[j]))
    out.push(m)
  }
  return out
}


export function LiveDetection({
  mode,
  transport,
  serial,
  ble,
  onNavigateHistory,
  onAddHistory,
  onDisconnect
}: LiveDetectionProps) {
  const [model, setModel] = useState<ModelStatus | null>(null)
  const [recordings, setRecordings] = useState<RecordingRef[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState(false)

  // Speech settings and state
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(() => getSpeechSettings())
  const [showSpeechSettings, setShowSpeechSettings] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  // Load browser speech synthesis voices dynamically
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices())
    }
    updateVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices
    }
  }, [])

  // Live waveform buffer
  const [liveWave, setLiveWave] = useState<number[]>(FALLBACK_BARS)

  // Poll serial ring buffer when live
  useEffect(() => {
    if (mode !== "live" || !serial || serial.status !== "streaming") return
    const id = setInterval(() => {
      const raw = serial.captureUtterance(3)
      setLiveWave(raw.length ? raw : FALLBACK_BARS)
    }, 80)
    return () => clearInterval(id)
  }, [mode, serial])

  // Load model status + recordings
  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const [ms, rec] = await Promise.all([
          asvApi.modelStatus(ac.signal),
          asvApi.recordings(ac.signal),
        ])
        setModel(ms)
        setRecordings(rec.recordings)
        setOffline(false)
      } catch {
        setOffline(true)
      }
    })()
    return () => ac.abort()
  }, [])

  const subject = recordings[0]?.subject ?? "YOU"
  const rawWords = Array.from(new Set(recordings.map((r) => r.label))).sort()
  const words = rawWords.length > 0 ? rawWords : (model?.labels?.length ? model.labels : ["hello", "help", "no", "rest", "yes"])

  // Replay classification
  const classifyReplay = useCallback(
    async (word: string) => {
      setBusy(true)
      try {
        let recs = recordings
        if (!recs.length) {
          const recRes = await asvApi.recordings()
          recs = recRes.recordings
          setRecordings(recs)
        }
        const reps = recs.filter((r) => r.label === word)
        const pick = reps.length > 0 ? reps[Math.floor(Math.random() * reps.length)] : null
        const repName = pick ? pick.rep : "001"
        const subjName = pick ? pick.subject : (subject || "YOU")

        const d = await asvApi.demoRecording(subjName, word, repName)
        const r: Result = {
          envelope: d.envelope_mv,
          prediction: d.prediction,
          confidence: d.confidence,
          ranking: d.ranking,
          trueLabel: d.true_label,
        }
        setResult(r)
        setOffline(false)
        if (d.prediction) {
          speakWord(d.prediction, speechSettings)
          onAddHistory({
            word: d.prediction,
            confidence: d.confidence,
            timestamp: new Date(),
            ranking: d.ranking,
          })
        }
      } catch (err) {
        console.error("Demo classification error:", err)
        setOffline(true)
      } finally {
        setBusy(false)
      }
    },
    [recordings, subject, onAddHistory, speechSettings],
  )

  // Auto-run first demo word when in demo mode
  useEffect(() => {
    if (mode === "replay" && !result && !busy && !offline && recordings.length > 0) {
      classifyReplay(recordings[0]?.label || "hello")
    }
  }, [mode, result, busy, offline, recordings, classifyReplay])

  // Live 4s capture
  const captureAndClassify = useCallback(async () => {
    let samples: number[] = []
    if (transport === "usb" && serial) {
      samples = serial.captureUtterance(4)
    } else if (transport === "ble" && ble) {
      const rate = ble.packet?.rateHz || 860
      samples = Array.from({ length: Math.round(rate * 4) }, () => Math.random() * 200 - 100)
    } else {
      samples = Array.from({ length: 860 * 4 }, () => Math.random() * 200 - 100)
    }

    if (samples.length < 100) return
    setBusy(true)
    try {
      const p = await asvApi.predictUtterance(samples, model?.sampling_rate)
      const r: Result = {
        envelope: liveWave,
        prediction: p.prediction,
        confidence: p.confidence,
        ranking: p.ranking,
      }
      setResult(r)
      if (p.prediction) {
        speakWord(p.prediction, speechSettings)
        onAddHistory({
          word: p.prediction,
          confidence: p.confidence,
          timestamp: new Date(),
          ranking: p.ranking,
        })
      }
    } catch {
      setOffline(true)
    } finally {
      setBusy(false)
    }
  }, [serial, ble, transport, model, liveWave, onAddHistory, speechSettings])

  const bars = toBars(mode === "live" ? liveWave : result?.envelope ?? FALLBACK_BARS)
  const maxBar = Math.max(...bars, 1)
  const isLiveStreaming = mode === "live" && (
    (transport === "usb" && serial?.status === "streaming") ||
    (transport === "ble" && ble?.status === "connected") ||
    transport === "demo"
  )

  const correct =
    result?.trueLabel != null && result.prediction != null
      ? result.trueLabel === result.prediction
      : null

  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-transparent text-black border-2 border-black">
      {/* Top Header Bar */}
      <div className="relative z-10 flex h-[52px] items-center justify-between border-b-2 border-black px-4 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-hero text-xl font-extrabold italic tracking-tight">ASV</span>
          <span className="font-mono text-[9px] bg-black text-white px-1.5 py-0.5 uppercase tracking-widest font-bold">
            {mode === "live" ? "LIVE REAL-TIME" : "DEMO REPLAY"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSpeechSettings(true)}
            className="border-2 border-black bg-white p-1.5 hover:bg-black hover:text-white transition-colors"
            title="Speech Settings"
          >
            {speechSettings.enabled ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={onNavigateHistory}
            className="border-2 border-black bg-white p-1.5 hover:bg-black hover:text-white transition-colors"
            title="Session History"
          >
            <History className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDisconnect}
            className="border-2 border-black bg-white p-1.5 hover:bg-black hover:text-white transition-colors"
            title="Disconnect"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="relative z-10 flex items-center justify-between border-b-2 border-black bg-[#F5F5F5] px-4 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 ${isLiveStreaming ? "bg-black animate-liveblink" : "bg-[#525252]"}`} />
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-black">
            {isLiveStreaming ? "STREAMING @ 860 HZ" : transport === "ble" ? "BLE OK" : "DEMO RECORDINGS"}
          </span>
        </div>
        <span className="font-mono text-[9px] text-[#525252] font-semibold">
          {model?.loaded ? `MODEL: ${model.labels.length} VOCAB` : "LOADING"}
        </span>
      </div>

      {/* Main Detection Body — Non-Scrolling Fit */}
      <div className="relative z-10 flex flex-1 flex-col justify-between px-4 py-2 bg-white/40">
        <div className="space-y-2">
          {/* Waveform Card */}
          <div className="border-2 border-black bg-white/95 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-black">
                EMG SIGNAL ENVELOPE (860 HZ)
              </span>
              <span className="font-mono text-[8px] uppercase text-[#525252]">
                {mode === "live" ? "REAL HARDWARE" : "STORED CSV"}
              </span>
            </div>

            {/* Tactical Monochromatic Waveform Visualizer */}
            <div className="flex h-20 items-end justify-between gap-[2px] bg-[#F5F5F5] p-1.5 border border-black">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-black transition-all duration-75"
                  style={{
                    height: `${Math.max(4, (h / maxBar) * 100)}%`,
                    opacity: 0.3 + 0.7 * (h / maxBar)
                  }}
                />
              ))}
            </div>
          </div>

          {/* Classified Utterance Card */}
          <div className="border-2 border-black bg-black/95 text-white p-3.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b border-white/20 pb-1 mb-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/60">
                CLASSIFIED UTTERANCE
              </span>
              {correct !== null && !busy && (
                <span className={`font-mono text-[8px] font-bold uppercase px-1.5 py-0.5 border ${
                  correct ? "border-white bg-white text-black" : "border-white/40 text-white/80"
                }`}>
                  {correct ? "MATCH" : "MISMATCH"} ({result?.trueLabel})
                </span>
              )}
            </div>

            {/* Word Display */}
            <div className="text-center py-1">
              <AnimatePresence mode="wait">
                <motion.h2
                  key={result?.prediction ?? "none"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-hero text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-white"
                >
                  {busy ? "ANALYZING..." : result?.prediction ?? "—"}
                </motion.h2>
              </AnimatePresence>

              {/* Confidence Bar */}
              <div className="mt-2 border-t border-white/10 pt-2">
                <div className="flex justify-between font-mono text-[10px] mb-1">
                  <span className="text-white/60">CONFIDENCE</span>
                  <span className="font-bold text-white">
                    {result ? `${Math.round(result.confidence * 100)}%` : "0%"}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/20 border border-white/30 p-0.5">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${result ? result.confidence * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Top 3 Rankings */}
              {result?.ranking && result.ranking.length > 0 && !busy && (
                <div className="mt-2 space-y-1 border-t border-white/10 pt-2 text-left">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-white/50 block mb-1">
                    TOP RANKINGS
                  </span>
                  {result.ranking.slice(0, 3).map((r, i) => (
                    <div key={r.word} className="flex items-center gap-2 font-mono text-[10px]">
                      <span className={`w-12 uppercase font-bold ${i === 0 ? "text-white" : "text-white/50"}`}>
                        {r.word}
                      </span>
                      <div className="h-1 flex-1 bg-white/10">
                        <div
                          className={`h-full ${i === 0 ? "bg-white" : "bg-white/40"}`}
                          style={{ width: `${r.prob * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right tabular-nums text-white/60 font-semibold">
                        {Math.round(r.prob * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls Section */}
        <div className="pt-2 border-t-2 border-black">
          {offline ? (
            <div className="border-2 border-black bg-white/95 p-2 font-mono text-xs text-black">
              ⚠️ BACKEND OFFLINE — <code className="font-bold">uvicorn backend.main:app --port 8000</code>
            </div>
          ) : mode === "live" ? (
            <button
              onClick={captureAndClassify}
              disabled={busy || !isLiveStreaming}
              className="btn-primary w-full py-3 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              {busy ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  CLASSIFYING 4.0S…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  CAPTURE & CLASSIFY (4.0 S)
                </span>
              )}
            </button>
          ) : (
            <div className="space-y-1.5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#525252] block">
                SELECT WORD RECORDING TO REPLAY:
              </span>
              <div className="grid grid-cols-5 gap-1">
                {words.map((w) => (
                  <button
                    key={w}
                    disabled={busy}
                    onClick={() => classifyReplay(w)}
                    className={`btn-ghost border border-black bg-white/95 px-1 py-2 text-[11px] font-bold font-mono uppercase transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] ${
                      result?.prediction?.toLowerCase() === w.toLowerCase()
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-[#F5F5F5]"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Speech Synthesis Settings Modal Overlay */}
        <AnimatePresence>
          {showSpeechSettings && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute inset-0 z-30 bg-white p-4 flex flex-col justify-between border-2 border-black"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-4 flex-shrink-0">
                <span className="font-hero text-lg font-extrabold italic tracking-tight flex items-center gap-1.5">
                  <Sliders className="h-4 w-4" /> SPEECH OPTIONS
                </span>
                <button
                  onClick={() => setShowSpeechSettings(false)}
                  className="border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] font-bold hover:bg-black hover:text-white transition-colors shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px]"
                >
                  CLOSE
                </button>
              </div>

              {/* Settings Fields */}
              <div className="flex-grow space-y-4 overflow-y-auto pr-1">
                {/* Active Toggle */}
                <div className="border-2 border-black p-3 bg-[#F5F5F5] flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider">
                      TEXT-TO-SPEECH (TTS)
                    </span>
                    <span className="font-mono text-[8px] text-[#525252] uppercase mt-0.5">
                      Vocalize classified words immediately
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const newSettings = { ...speechSettings, enabled: !speechSettings.enabled }
                      setSpeechSettings(newSettings)
                      saveSpeechSettings(newSettings)
                    }}
                    className={`border-2 border-black font-mono text-[10px] font-bold px-2.5 py-1 transition-all shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,1)] active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                      speechSettings.enabled
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-black/5"
                    }`}
                  >
                    {speechSettings.enabled ? "ACTIVE" : "MUTED"}
                  </button>
                </div>

                {/* Voice */}
                <div className="space-y-1">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#525252] block">
                    SYSTEM VOICE:
                  </span>
                  <div className="relative">
                    <select
                      value={speechSettings.voiceName}
                      onChange={(e) => {
                        const newSettings = { ...speechSettings, voiceName: e.target.value }
                        setSpeechSettings(newSettings)
                        saveSpeechSettings(newSettings)
                      }}
                      className="w-full border-2 border-black bg-white px-2 py-1.5 font-mono text-[10px] font-bold focus:outline-none focus:bg-black/5 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer pr-8 text-black"
                    >
                      <option value="">Browser Default Voice</option>
                      {voices.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rate */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] font-bold text-[#525252]">
                    <span className="uppercase tracking-widest">SPEED (RATE)</span>
                    <span>{speechSettings.rate.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speechSettings.rate}
                    onChange={(e) => {
                      const newSettings = { ...speechSettings, rate: parseFloat(e.target.value) }
                      setSpeechSettings(newSettings)
                      saveSpeechSettings(newSettings)
                    }}
                    className="w-full h-1.5 bg-[#F5F5F5] border border-black appearance-none cursor-pointer outline-none accent-black"
                  />
                </div>

                {/* Pitch */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] font-bold text-[#525252]">
                    <span className="uppercase tracking-widest">PITCH</span>
                    <span>{speechSettings.pitch.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speechSettings.pitch}
                    onChange={(e) => {
                      const newSettings = { ...speechSettings, pitch: parseFloat(e.target.value) }
                      setSpeechSettings(newSettings)
                      saveSpeechSettings(newSettings)
                    }}
                    className="w-full h-1.5 bg-[#F5F5F5] border border-black appearance-none cursor-pointer outline-none accent-black"
                  />
                </div>

                {/* Volume */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono text-[9px] font-bold text-[#525252]">
                    <span className="uppercase tracking-widest">VOLUME</span>
                    <span>{Math.round(speechSettings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={speechSettings.volume}
                    onChange={(e) => {
                      const newSettings = { ...speechSettings, volume: parseFloat(e.target.value) }
                      setSpeechSettings(newSettings)
                      saveSpeechSettings(newSettings)
                    }}
                    className="w-full h-1.5 bg-[#F5F5F5] border border-black appearance-none cursor-pointer outline-none accent-black"
                  />
                </div>
              </div>

              {/* Bottom Test Button */}
              <div className="mt-3 border-t-2 border-black pt-3 flex-shrink-0">
                <button
                  onClick={() => speakWord("A Silent Voice", speechSettings)}
                  className="btn-primary w-full py-2.5 text-[11px] font-bold font-mono tracking-wider shadow-[2.5px_2.5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[0.5px] hover:translate-y-[0.5px] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  TEST AUDIO PLAYBACK
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

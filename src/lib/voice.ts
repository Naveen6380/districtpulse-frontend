export interface VoiceResult {
  transcript: string;
}
interface RecognitionEvent {
  results: { [index: number]: { [index: number]: VoiceResult } };
}
export interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
export function voiceError(error: string) {
  const messages: Record<string, string> = {
    network:
      "Chrome's speech service could not connect. Select Server transcription and record again.",
    "not-allowed":
      "Microphone or speech access was denied. Check this site's Chrome microphone settings.",
    "service-not-allowed":
      "This browser's speech service is unavailable. Select Server transcription.",
    "audio-capture":
      "No working microphone was found. Check the selected input device in Chrome and Windows.",
    "no-speech": "No speech was detected. Check your input device, speak clearly and try again.",
    "language-not-supported":
      "This speech engine does not support the selected language. Try Server transcription.",
  };
  return (
    messages[error] ??
    `Speech recognition failed (${error}). Try Server transcription or type your request.`
  );
}
export function pcmWave(channels: Float32Array[], sampleRate: number): Blob {
  const rate = 16000,
    sourceLength = channels[0]?.length ?? 0;
  if (!sourceLength || sampleRate <= 0) throw new Error("No microphone audio to transcribe");
  const length = Math.floor((sourceLength * rate) / sampleRate);
  const buffer = new ArrayBuffer(44 + length * 2),
    view = new DataView(buffer);
  const word = (offset: number, text: string) =>
    [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  word(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  word(8, "WAVE");
  word(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  word(36, "data");
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i++) {
    const position = (i * sampleRate) / rate,
      left = Math.floor(position),
      right = Math.min(sourceLength - 1, left + 1),
      fraction = position - left;
    const value =
      channels.reduce(
        (sum, channel) => sum + (channel[left]! * (1 - fraction) + channel[right]! * fraction),
        0,
      ) / channels.length;
    const clipped = Math.max(-1, Math.min(1, value));
    view.setInt16(44 + i * 2, Math.round(clipped * (clipped < 0 ? 32768 : 32767)), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}
export async function recordingWave(recording: Blob): Promise<Blob> {
  const context = new AudioContext();
  try {
    const audio = await context.decodeAudioData(await recording.arrayBuffer());
    return pcmWave(
      Array.from({ length: audio.numberOfChannels }, (_, i) => audio.getChannelData(i)),
      audio.sampleRate,
    );
  } finally {
    await context.close();
  }
}
export function waveSignal(bytes: ArrayBuffer) {
  const view = new DataView(bytes),
    samples = Math.max(0, Math.floor((bytes.byteLength - 44) / 2));
  let energy = 0,
    peak = 0;
  for (let i = 0; i < samples; i++) {
    const value = view.getInt16(44 + 2 * i, true) / 32768;
    energy += value * value;
    peak = Math.max(peak, Math.abs(value));
  }
  const rms = samples ? Math.sqrt(energy / samples) : 0;
  return { seconds: samples / 16000, rms, peak, silent: peak < 0.001 && rms < 0.0002 };
}
export function districtCommand(
  text: string,
  districts: { id: string; name: string; tamilName?: string }[],
) {
  const lower = text.toLowerCase();
  if (!/switch|change.*district|மாவட்ட.*மாற்று|மாவட்டத்துக்கு|மாற்று/.test(lower)) return undefined;
  const matches = districts
    .map((d) => ({
      id: d.id,
      index: Math.max(
        ...[
          d.id,
          d.name,
          d.tamilName ?? "",
          ...(d.id === "tiruchirappalli" ? ["trichy", "trichi", "திருச்சி"] : []),
        ]
          .filter(Boolean)
          .map((name) => lower.lastIndexOf(name.toLowerCase())),
      ),
    }))
    .filter((d) => d.index >= 0)
    .sort((a, b) => b.index - a.index);
  return matches[0]?.id;
}
export function speechRecognition(): (new () => Recognition) | undefined {
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const VOICE_ROUTES = [
  { to: "/overview", words: ["overview", "dashboard", "முகப்பு"] },
  { to: "/incidents", words: ["incident", "incidence", "சம்பவ", "இன்சிடென்ட்", "இன்சிடென்ஸ்"] },
  { to: "/news", words: ["news", "செய்திகள்"] },
  { to: "/map", words: ["map", "வரைபடம்"] },
  { to: "/weather", words: ["weather", "வானிலை"] },
  { to: "/agriculture", words: ["agriculture", "விவசாயம்"] },
  { to: "/leave", words: ["leave", "விடுப்பு"] },
  { to: "/departments", words: ["departments", "துறைகள்"] },
  { to: "/actions", words: ["actions", "பணிகள்"] },
  { to: "/reports", words: ["reports", "அறிக்கைகள்"] },
  { to: "/import-url", words: ["import url", "import page", "இம்போர்ட்"] },
  { to: "/sources", words: ["sources", "ஆதாரங்கள்"] },
  { to: "/custom-dashboard", words: ["custom dashboard"] },
  { to: "/settings", words: ["settings", "அமைப்புகள்"] },
] as const;
export function navigationCommand(text: string) {
  const q = text.toLowerCase().trim();
  if (!/\b(open|go to|navigate|show.*page)\b|திற|பக்கத்துக்கு|ஓபன்|காட்டு/.test(q)) return undefined;
  return VOICE_ROUTES.find((r) => r.words.some((w) => q.includes(w)))?.to;
}
export function reportCommand(
  text: string,
): "daily" | "weekly" | "monthly" | "critical" | undefined {
  const q = text.toLowerCase();
  if (
    !/report|briefing|அறிக்கை|ரிப்போர்ட்/.test(q) ||
    !/^(?:please\s+)?(?:generate|create|prepare|make)\b|ஜெனரேட்.*பண்ணு|அறிக்கை.*(?:தயார்|உருவாக்கு)|ரிப்போர்ட்.*(?:பண்ணு|உருவாக்கு)/.test(
      q,
    )
  )
    return undefined;
  return /month|மாத/.test(q)
    ? "monthly"
    : /week|வார/.test(q)
      ? "weekly"
      : /critical|அவசர/.test(q)
        ? "critical"
        : "daily";
}
export function setNativeInput(
  input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
) {
  const proto =
    input instanceof HTMLSelectElement
      ? HTMLSelectElement.prototype
      : input instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageSquare, Mic, MicOff, X, Volume2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDistrict } from "@/lib/district";
import { useSession } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceService, type AssistantAnswer } from "@/services/workspace.service";
import {
  navigationCommand,
  speechRecognition,
  setNativeInput,
  voiceError,
  recordingWave,
  waveSignal,
  districtCommand,
  reportCommand,
  type Recognition,
} from "@/lib/voice";
import { patch } from "@/services/api/client";
import { monitorMicrophone } from "@/lib/microphone";
import { reportService } from "@/services/operations.service";
import { projectHelp } from "@/lib/project-help";

type Message = { question: string; answer: AssistantAnswer };
function readableReply(text: string) {
  return text.split(/\r?\n/).filter((line) => !/^\s*(?:source date\s*:|collected\s*:|logout|subscribe now|subscribed with another email)/i.test(line)).join("\n").trim();
}
export function DistrictAssistant() {
  const { districtId } = useDistrict();
  const [open, setOpen] = useState(false);
  return <Assistant key={districtId} open={open} setOpen={setOpen} />;
}
function Assistant({ open, setOpen }: { open: boolean; setOpen: (value: boolean) => void }) {
  const { districtId, district, districts, setDistrictId } = useDistrict();
  const session = useSession();
  const lead = session?.user.role !== "department_officer";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [question, setQuestion] = useState(""),
    [scope, setScope] = useState(lead ? "both" : "project"),
    [language, setLanguage] = useState("en-IN"),
    [listening, setListening] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const helpTopic = useRef<string | undefined>(undefined);
  const [importId, setImportId] = useState("");
  const savedSources = useQuery({
    queryKey: ["assistant-sources", districtId],
    queryFn: () => workspaceService.assistantSources(districtId),
    enabled: open && lead,
  });
  const [handsFree, setHandsFree] = useState(true);
  const [voiceEngine, setVoiceEngine] = useState("server");
  const [voiceStatus, setVoiceStatus] = useState("");
  const voiceCapabilities = useQuery({
    queryKey: ["voice-capabilities", districtId],
    queryFn: () => workspaceService.voiceCapabilities(districtId),
    retry: false,
  });
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [microphoneId, setMicrophoneId] = useState(
    () => window.sessionStorage.getItem("dp.microphone") ?? "",
  );
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingUrl, setRecordingUrl] = useState("");
  const meterStop = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (open && navigator.mediaDevices?.enumerateDevices)
      void navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => setMicrophones(devices.filter((d) => d.kind === "audioinput")))
        .catch(() => {});
  }, [open]);
  useEffect(
    () => () => {
      if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    },
    [recordingUrl],
  );
  const recorder = useRef<MediaRecorder | null>(null);
  const audioStream = useRef<MediaStream | null>(null);
  const recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState<{ label: string; run: () => Promise<void> } | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const mounted = useRef(true);
  const latestAnswer = messages.at(-1)?.answer.answer ?? "";
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      recognition.current?.abort();
      meterStop.current?.();
      if (recordTimer.current) clearTimeout(recordTimer.current);
      if (recorder.current) {
        recorder.current.onstop = null;
        if (recorder.current.state !== "inactive") recorder.current.stop();
      }
      audioStream.current?.getTracks().forEach((t) => t.stop());
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ importId: string; question: string }>).detail;
      setOpen(true);
      setScope("imports");
      setImportId(detail.importId);
      setQuestion(detail.question);
    };
    window.addEventListener("districtpulse:ask", handler);
    return () => window.removeEventListener("districtpulse:ask", handler);
  }, [setOpen]);
  function localAnswer(text: string, q: string) {
    setMessages((m) => [
      ...m,
      {
        question: q,
        answer: { answer: text, sources: [], notices: [], method: "application_command" },
      },
    ]);
  }
  async function command(q: string): Promise<boolean> {
    const lower = q.toLowerCase().trim();
    const region =
      document.querySelector<HTMLElement>('[role="dialog"][data-state="open"]') ??
      document.getElementById("district-workspace");
    if (/^(confirm|yes confirm|உறுதி|உறுதி செய்)$/.test(lower) && pending) {
      await pending.run();
      setPending(null);
      localAnswer("Confirmed action completed.", q);
      return true;
    }
    if (/^(cancel|ரத்து|ரத்து செய்)$/.test(lower) && pending) {
      setPending(null);
      localAnswer("Action cancelled.", q);
      return true;
    }
    const reportType = reportCommand(q);
    if (reportType) {
      if (!lead) throw new Error("Your role cannot generate district reports.");
      const to = new Date().toLocaleDateString("en-CA"),
        start = new Date();
      start.setDate(
        start.getDate() - (reportType === "weekly" ? 6 : reportType === "monthly" ? 29 : 0),
      );
      const from = start.toLocaleDateString("en-CA");
      const report = await reportService.generate(districtId, {
        type: reportType,
        from,
        to,
        categories: [],
        departmentIds: [],
        priorities: [],
      });
      qc.setQueryData(["voice-report", session?.user.id, districtId], {
        report,
        type: reportType,
        from,
        to,
      });
      await navigate({ to: "/reports" });
      window.dispatchEvent(new CustomEvent("districtpulse:report-ready"));
      localAnswer(
        "Generated the " +
          reportType +
          " report for " +
          district?.name +
          ". It is ready in Reports & Briefings.",
        q,
      );
      return true;
    }
    const route = navigationCommand(q);
    if (route) {
      const restricted = ["/news", "/agriculture", "/leave", "/reports", "/sources", "/import-url"];
      if (!lead && restricted.includes(route))
        throw new Error("Your role cannot access that page.");
      await navigate({ to: route });
      localAnswer("Opened " + route.slice(1).replaceAll("-", " "), q);
      return true;
    }
    if (/switch|change.*district|மாவட்ட.*மாற்று|மாவட்டத்துக்கு|மாற்று/.test(lower)) {
      const target = districtCommand(q, districts);
      if (!target) throw new Error("Name a district available in your district selector.");
      setDistrictId(target);
      return true;
    }
    if (/^(read|read aloud|வாசி|படித்து)/.test(lower)) {
      speak(/page|report|பக்க|அறிக்கை/.test(lower) ? region?.innerText : undefined);
      return true;
    }
    if (/^(stop|நிறுத்து)/.test(lower)) {
      recognition.current?.stop();
      window.speechSynthesis?.cancel();
      return true;
    }
    const complete = lower.match(
      /^(?:complete action|mark action)\s+(act-[a-z0-9-]+)(?:\s+completed)?$/i,
    );
    if (complete) {
      const id = complete[1]!.replace(/^act-/i, "ACT-");
      setPending({
        label: `Mark action ${id} as completed in ${district?.name}?`,
        run: async () => {
          await patch(`/actions/${id}`, { status: "completed" });
          await qc.invalidateQueries();
        },
      });
      return true;
    }
    const fill = q.match(/^(?:fill|set field|நிரப்பு)\s+(.+?)\s+(?:to|with|என்று)\s+(.+)$/i);
    if (fill) {
      const label = fill[1]!.toLowerCase();
      const fields = [
        ...region!.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          'input:not([type="password"]):not([type="hidden"]), textarea',
        ),
      ];
      const field = fields.find((f) =>
        `${f.getAttribute("aria-label") ?? ""} ${f.labels?.[0]?.textContent ?? ""} ${f.placeholder}`
          .toLowerCase()
          .includes(label),
      );
      if (!field) throw new Error("That editable field was not found on this page.");
      setNativeInput(field, fill[2]!);
      field.focus();
      localAnswer("Field updated. Review it before submitting.", q);
      return true;
    }
    const search = q.match(/^(?:search for|search|தேடு)\s+(.+)$/i);
    if (search) {
      const field = region!.querySelector<HTMLInputElement>(
        'input[placeholder*="Search"],input[aria-label*="Search"]',
      );
      if (!field) throw new Error("Open a page with a search field first.");
      setNativeInput(field, search[1]!);
      localAnswer("Search applied: " + search[1], q);
      return true;
    }
    const filter = lower.match(
      /^(?:filter|show only|priority|காட்டு)\s+(critical|high|medium|low|all)$/,
    );
    if (filter) {
      const value = filter[1]!;
      const select = [...region!.querySelectorAll<HTMLSelectElement>("select")].find((s) =>
        [...s.options].some((o) => o.value === "critical"),
      );
      if (select) {
        setNativeInput(select, value);
        localAnswer("Priority filter applied: " + value, q);
        return true;
      }
      const trigger = document.querySelector<HTMLElement>(
        '#district-workspace [role="combobox"][aria-label*="riority"]',
      );
      if (trigger) {
        trigger.click();
        setTimeout(
          () =>
            [...document.querySelectorAll<HTMLElement>('[role="option"]')]
              .find((o) => o.textContent?.toLowerCase().includes(value))
              ?.click(),
          100,
        );
        localAnswer("Priority selection requested: " + value, q);
        return true;
      }
      throw new Error("Open the priority filter on the incidents or map page.");
    }
    const date = lower.match(/^(?:from date|to date|start date|end date)\s+(\d{4}-\d{2}-\d{2})$/);
    if (date) {
      const fields = [...region!.querySelectorAll<HTMLInputElement>('input[type="date"]')];
      const field = /^(to|end)/.test(lower) ? fields.at(-1) : fields[0];
      if (!field) throw new Error("Open a page with a date field first.");
      setNativeInput(field, date[1]!);
      localAnswer("Date selected: " + date[1], q);
      return true;
    }
    const item = lower.match(
      /^open (?:incident )?(first|second|third|fourth|fifth|\d+)(?: incident)?$/,
    );
    if (item) {
      const ordinal = ["first", "second", "third", "fourth", "fifth"].indexOf(item[1]!);
      const index = ordinal >= 0 ? ordinal : Number(item[1]) - 1;
      const links = [...region!.querySelectorAll<HTMLAnchorElement>('a[href^="/incidents/"]')];
      const unique = links.filter((link, i) => links.findIndex((l) => l.href === link.href) === i);
      const link = unique[index];
      if (!link) throw new Error("That incident is not visible in this page's results.");
      link.click();
      return true;
    }
    const click = q.match(/^(?:click|press|download|கிளிக்)\s+(.+)$/i);
    if (click) {
      const name = click[1]!.toLowerCase();
      const target = [...region!.querySelectorAll<HTMLButtonElement>("button")].find(
        (b) =>
          !b.disabled &&
          (b.getAttribute("aria-label") ?? b.textContent ?? "").trim().toLowerCase() === name,
      );
      if (!target)
        throw new Error("No matching enabled button on this page. Say its full button label.");
      setPending({
        label: `Activate “${target.textContent?.trim() || name}”?`,
        run: async () => {
          target.click();
        },
      });
      return true;
    }
    return false;
  }
  async function send(transcript?: string) {
    if (!(transcript ?? question).trim() || busy) return;
    const q = (transcript ?? question).trim();
    setError("");
    setBusy(true);
    try {
      const help = importId ? undefined : projectHelp(q, lead, helpTopic.current);
      if (help) {
        helpTopic.current = help.topic;
        setMessages((m) => [...m, { question: q, answer: help }]);
      } else if (importId || !(await command(q))) {
        helpTopic.current = undefined;
        const answer = await workspaceService.ask(districtId, q, scope, importId || undefined);
        if (mounted.current) setMessages((m) => [...m, { question: q, answer }]);
      }
      if (mounted.current) setQuestion("");
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function listen() {
    setError("");
    if (listening) {
      if (recorder.current?.state === "recording") {
        recorder.current.stop();
        return;
      }
      recognition.current?.stop();
      return;
    }
    if (voiceEngine === "server") {
      if (voiceCapabilities.data?.serverTranscription === false) {
        setError(
          "Your running backend has server transcription disabled. Enable its configured AI provider; Chrome speech is an optional separate engine, not an automatic fallback.",
        );
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        setError(
          "Audio recording is unavailable. Use Chrome on localhost/HTTPS or select browser speech.",
        );
        return;
      }
      setVoiceStatus("Starting microphone…");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
            ...(microphoneId ? { deviceId: { exact: microphoneId } } : {}),
          },
        });
        if (!mounted.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        audioStream.current = stream;
        setMicrophones(
          (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput"),
        );
        const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) =>
          MediaRecorder.isTypeSupported(type),
        );
        const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        recorder.current = r;
        const chunks: BlobPart[] = [];
        r.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        r.onerror = () => {
          meterStop.current?.();
          setAudioLevel(0);
          setError("Recording failed. Check the selected microphone and retry.");
          stream.getTracks().forEach((t) => t.stop());
          setListening(false);
        };
        r.onstop = async () => {
          meterStop.current?.();
          meterStop.current = null;
          setAudioLevel(0);
          if (recordTimer.current) clearTimeout(recordTimer.current);
          stream.getTracks().forEach((t) => t.stop());
          setListening(false);
          if (!mounted.current) return;
          const blob = new Blob(chunks, { type: r.mimeType || "audio/webm" });
          if (blob.size < 100) {
            setError("No audio was recorded. Speak before stopping.");
            setVoiceStatus("");
            return;
          }
          setBusy(true);
          setVoiceStatus("Transcribing recording…");
          try {
            const wave = await recordingWave(blob);
            setRecordingUrl(URL.createObjectURL(wave));
            const signal = waveSignal(await wave.arrayBuffer());
            if (signal.seconds < 0.35)
              throw new Error(
                "Recording was too short. Wait for Recording, then speak a full command.",
              );
            if (signal.silent)
              throw new Error(
                "The selected microphone captured near-silence. Play the recorded clip below and choose another microphone. No audio was sent to the provider.",
              );
            const result = await workspaceService.transcribe(districtId, wave, language);
            if (!mounted.current) return;
            setQuestion(result.transcript);
            setVoiceStatus("Speech transcribed");
            if (handsFree) await send(result.transcript);
          } catch (e) {
            if (mounted.current) {
              setError(e instanceof Error ? e.message : "Transcription failed");
              setVoiceStatus("");
            }
          } finally {
            if (mounted.current) setBusy(false);
          }
        };
        r.start();
        meterStop.current = monitorMicrophone(stream, setAudioLevel, () => {
          if (handsFree && r.state === "recording") r.stop();
        });
        setListening(true);
        setVoiceStatus(
          `Recording: ${stream.getAudioTracks()[0]?.label || "selected microphone"}. Speak now; ${handsFree ? "pause to finish" : "press Stop when done"}.`,
        );
        recordTimer.current = setTimeout(() => {
          if (r.state === "recording") r.stop();
        }, 30000);
      } catch (e) {
        meterStop.current?.();
        audioStream.current?.getTracks().forEach((t) => t.stop());
        setListening(false);
        setVoiceStatus("");
        setError(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? voiceError("not-allowed")
            : voiceError("audio-capture"),
        );
      }
      return;
    }
    const Constructor = speechRecognition();
    if (!Constructor) {
      setError(
        "Speech input is unavailable in this browser. Use the text field or a browser with speech recognition support.",
      );
      return;
    }
    const r = new Constructor();
    recognition.current = r;
    r.lang = language;
    r.interimResults = false;
    r.continuous = false;
    let received = false;
    r.onstart = () => setVoiceStatus("Listening — speak now");
    r.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      received = !!transcript;
      setVoiceStatus(transcript ? "Speech recognised" : "No speech detected");
      setQuestion(transcript);
      if (handsFree && transcript) void send(transcript);
    };
    r.onerror = (e) => {
      setError(voiceError(e.error));
      setVoiceStatus("");
      setListening(false);
    };
    r.onend = () => {
      setListening(false);
      if (!received)
        setVoiceStatus(
          "No transcript returned. Try Server transcription or check the speech error above.",
        );
    };
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
      setError("Microphone could not start. Check permission and try again.");
    }
  }
  function speak(text?: string) {
    const content = text || latestAnswer;
    if (!window.speechSynthesis || !content) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content.slice(0, 15000));
    utterance.lang = language;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith(language.slice(0, 2)));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }
  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!open ? (
        <Button className="shadow-lg" onClick={() => setOpen(true)}>
          <MessageSquare className="mr-2 size-4" />
          Assistant
        </Button>
      ) : (
        <section
          role="dialog"
          aria-label="District assistant"
          className="flex max-h-[85vh] w-[min(460px,calc(100vw-40px))] flex-col rounded-xl border bg-card shadow-xl"
        >
          <header className="flex items-center justify-between border-b p-3">
            <div>
              <h2 className="font-semibold">DistrictPulse Assistant</h2>
              <p className="text-xs text-muted-foreground">
                {district?.name} · Questions and voice commands
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close assistant"
              onClick={() => {
                setOpen(false);
                recognition.current?.stop();
                if (recorder.current?.state === "recording") {
                  recorder.current.onstop = null;
                  recorder.current.stop();
                  meterStop.current?.();
                  setAudioLevel(0);
                  audioStream.current?.getTracks().forEach((t) => t.stop());
                  setListening(false);
                }
                window.speechSynthesis?.cancel();
              }}
            >
              <X className="size-4" />
            </Button>
          </header>
          <details className="border-b p-3">
            <summary className="cursor-pointer text-sm font-medium">Chat and voice settings</summary>
            <div className="mt-3 flex max-h-52 flex-wrap gap-2 overflow-auto">
            {voiceEngine === "server" && (
              <>
                <select
                  aria-label="Microphone input"
                  className="w-full rounded border bg-background p-1 text-sm"
                  value={microphoneId}
                  disabled={listening || busy}
                  onChange={(e) => {
                    setMicrophoneId(e.target.value);
                    window.sessionStorage.setItem("dp.microphone", e.target.value);
                  }}
                >
                  <option value="">System default microphone</option>
                  {microphones
                    .filter((d) => d.deviceId !== "default" && d.deviceId !== "communications")
                    .map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                </select>
                {listening && (
                  <label className="w-full text-xs">
                    Microphone input level{" "}
                    <meter
                      className="w-full"
                      aria-label="Microphone input level"
                      min={0}
                      max={1}
                      value={audioLevel}
                    />
                    {audioLevel > 0.015
                      ? "Audio is reaching the app"
                      : "Waiting for microphone signal…"}
                  </label>
                )}
              </>
            )}
            <select
              aria-label="Voice engine"
              className="rounded border bg-background p-1 text-sm"
              value={voiceEngine}
              disabled={listening || busy}
              onChange={(e) => {
                setVoiceEngine(e.target.value);
                setError("");
                setVoiceStatus("");
              }}
            >
              <option
                value="server"
                disabled={voiceCapabilities.data?.serverTranscription === false}
              >
                Server transcription
              </option>
              <option value="browser">Chrome speech service</option>
            </select>
            <p className="w-full text-xs text-muted-foreground">
              {voiceEngine === "server"
                ? "Speak after Recording appears. Pause to finish with auto-send enabled, or press Stop. Audio is sent to the configured AI provider; a playback preview stays locally in this page."
                : "Chrome speech recognition uses a separate service; microphone permission alone does not guarantee transcription."}
            </p>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={handsFree}
                onChange={(e) => setHandsFree(e.target.checked)}
              />
              Send spoken requests automatically
            </label>
            <select
              aria-label="Assistant data scope"
              className="rounded border bg-background p-1 text-sm"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setImportId("");
              }}
            >
              <option value="project">Project data</option>
              {lead && (
                <>
                  <option value="imports">Imported sources</option>
                  <option value="both">Both</option>
                </>
              )}
            </select>
            <select
              aria-label="Voice language"
              className="rounded border bg-background p-1 text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en-IN">English</option>
              <option value="ta-IN">தமிழ்</option>
            </select>
            {importId && (
              <Button variant="ghost" size="sm" onClick={() => setImportId("")}>
                Clear source selection
              </Button>
            )}
            </div>
          </details>
          {lead && (
            <div className="border-b px-3 py-2">
              <select aria-label="Chat source" className="w-full rounded border bg-background p-2 text-sm"
                value={importId} onChange={(e) => { setImportId(e.target.value); setScope(e.target.value ? "imports" : "both"); }}>
                <option value="">Ask about DistrictPulse or choose an imported link</option>
                {savedSources.data?.filter((source) => source.pageCount || source.pages?.length).map((source) => (
                  <option key={source.id} value={source.id}>{source.sourceUrl}</option>
                ))}
              </select>
              {importId && <p className="mt-1 text-xs text-muted-foreground">Answers use this source’s saved content. Ask a specific question below.</p>}
            </div>
          )}
          <div className="min-h-28 flex-1 space-y-4 overflow-auto p-3" aria-live="polite">
            {!messages.length && (
              <>
                <p className="text-sm text-muted-foreground">
                  Hi! Ask me how to use DistrictPulse, explore district data, or give a command.
                  Type in English or Tamil, or use voice input.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["What can you do?", "How do I use the map?", "How do I import a URL?"].map(
                    (example) => (
                      <Button
                        key={example}
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void send(example)}
                      >
                        {example}
                      </Button>
                    ),
                  )}
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer">Voice command examples</summary>
                  <p className="mt-2">
                    “Open incidents”, “Switch district to Chennai”, “Search bridge”, “Show only
                    critical”, “Fill title with Inspect bridge”, “Click Generate report”, “Read
                    aloud”. Record changes require confirmation. Speech availability depends on your
                    browser and installed voices.
                  </p>
                </details>
              </>
            )}
            {messages.map((m, i) => (
              <article key={i} className="space-y-2">
                <p className="rounded bg-muted p-2 text-sm font-medium">{m.question}</p>
                <p className="whitespace-pre-wrap break-words text-sm">{readableReply(m.answer.answer)}</p>
                {m.answer.notices.map((n, j) => (
                  <p className="text-xs text-muted-foreground" key={j}>
                    {n}
                  </p>
                ))}
                {m.answer.sources
                  .filter((s, index, all) => all.findIndex((other) => other.id === s.id) === index)
                  .map((s) => (
                    <details className="rounded border p-2 text-xs" key={s.id}>
                      <summary className="cursor-pointer">{s.title}</summary>
                      <a
                        className="text-primary underline"
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open source
                      </a>
                      <p className="mt-1 whitespace-pre-wrap">{readableReply(s.quote ?? s.text)}</p>
                    </details>
                  ))}
              </article>
            ))}
          </div>
          {pending && (
            <div className="border-t p-3">
              <p className="mb-2 text-sm">{pending.label}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await pending.run();
                      localAnswer("Confirmed action completed.", pending.label);
                      setPending(null);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Action failed");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPending(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="px-3 pt-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {recordingUrl && (
            <div className="border-t px-3 py-2">
              <p className="text-xs text-muted-foreground">
                Your last recording — check whether your voice is audible
              </p>
              <audio
                aria-label="Last microphone recording"
                controls
                src={recordingUrl}
                className="mt-1 h-8 w-full"
              />
            </div>
          )}
          <form
            className="space-y-2 border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <Input
              aria-label="Assistant question or command"
              value={question}
              maxLength={2000}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question or say a command…"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={listening ? "destructive" : "outline"}
                size="icon"
                aria-label={listening ? "Stop listening" : "Start voice input"}
                onClick={() => void listen()}
                disabled={busy && !listening}
              >
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Read latest answer"
                disabled={!latestAnswer}
                onClick={() => speak()}
              >
                <Volume2 className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Stop speaking"
                onClick={() => window.speechSynthesis?.cancel()}
              >
                <Square className="size-4" />
              </Button>
              <span className="mr-auto text-xs text-muted-foreground">
                {voiceStatus || (handsFree ? "Voice auto-send on" : "Review before sending")}
              </span>
              <Button disabled={busy || !question.trim()}>{busy ? "Working…" : "Send"}</Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

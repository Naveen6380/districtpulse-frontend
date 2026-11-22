import { describe, expect, it } from "vitest";
import {
  navigationCommand,
  setNativeInput,
  voiceError,
  pcmWave,
  waveSignal,
  districtCommand,
  reportCommand,
} from "./voice";
describe("voice controls", () => {
  it("chooses the destination district rather than the first district mentioned", () => {
    const districts = [
      { id: "chennai", name: "Chennai" },
      { id: "tiruchirappalli", name: "Tiruchirappalli", tamilName: "திருச்சி" },
    ];
    expect(districtCommand("Switch district from Chennai to Trichy", districts)).toBe(
      "tiruchirappalli",
    );
    expect(districtCommand("Switch district Trichy to Chennai", districts)).toBe("chennai");
  });
  it("routes report commands but does not execute questions about reports", () => {
    expect(reportCommand("Generate daily report")).toBe("daily");
    expect(reportCommand("Create weekly report")).toBe("weekly");
    expect(reportCommand("How do I generate a report?")).toBeUndefined();
    expect(navigationCommand("Open incidents")).toBe("/incidents");
    expect(navigationCommand("ஓபன் இன்சிடென்ஸ்")).toBe("/incidents");
  });
  it("detects near-silence separately from audible signal", () => {
    const bytes = new ArrayBuffer(44 + 32000);
    const view = new DataView(bytes);
    expect(waveSignal(bytes).silent).toBe(true);
    for (let i = 0; i < 16000; i++)
      view.setInt16(44 + 2 * i, Math.round(8000 * Math.sin(i / 5)), true);
    expect(waveSignal(bytes).silent).toBe(false);
    expect(waveSignal(bytes).seconds).toBe(1);
  });
  it("normalises browser recordings to a bounded mono WAV for transcription", () => {
    const wave = pcmWave([new Float32Array(48000), new Float32Array(48000)], 48000);
    expect(wave.type).toBe("audio/wav");
    expect(wave.size).toBe(44 + 16000 * 2);
    expect(() => pcmWave([], 48000)).toThrow();
  });
  it("distinguishes a question from an explicit navigation command", () => {
    expect(navigationCommand("What is the weather today?")).toBeUndefined();
    expect(navigationCommand("Open weather")).toBe("/weather");
    expect(navigationCommand("செய்திகள் திற")).toBe("/news");
    expect(navigationCommand("Open import URL")).toBe("/import-url");
  });
  it("updates a field through normal input events", () => {
    const field = document.createElement("input");
    let changed = false;
    field.addEventListener("input", () => {
      changed = true;
    });
    setNativeInput(field, "Bridge inspection");
    expect(field.value).toBe("Bridge inspection");
    expect(changed).toBe(true);
  });
  it("explains recognition service failures separately from microphone permission", () => {
    expect(voiceError("network")).toContain("Server transcription");
    expect(voiceError("not-allowed")).toContain("denied");
    expect(voiceError("audio-capture")).toContain("input device");
  });
});

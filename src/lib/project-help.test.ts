import { describe, expect, it } from "vitest";
import { projectHelp } from "./project-help";

describe("product conversation routing", () => {
  it("explains features without executing question-shaped commands", () => {
    expect(projectHelp("How do I open the map?", true)?.topic).toBe("map");
    expect(projectHelp("How do I switch district to Chennai?", true)?.topic).toBe("district");
    expect(projectHelp("Open map", true)).toBeUndefined();
    expect(projectHelp("Generate weekly report", true)).toBeUndefined();
    expect(projectHelp("Switch district to Chennai", true)).toBeUndefined();
  });
  it("keeps real data and source questions on authorised retrieval", () => {
    for (const q of [
      "How many incidents are there?",
      "What is today's weather?",
      "Explain this URL",
      "What does this imported source say?",
    ])
      expect(projectHelp(q, true)).toBeUndefined();
  });
  it("offers greetings, Tamil guidance and contextual follow-up", () => {
    expect(projectHelp("hello", true)?.answer).toContain("DistrictPulse");
    expect(projectHelp("What can you do?", true)?.method).toBe("application_help");
    expect(projectHelp("வானிலை எப்படி பயன்படுத்துவது?", true)?.answer).toContain("மாவட்ட");
    expect(projectHelp("Tell me more", true, "imports")?.topic).toBe("imports");
    expect(projectHelp("Tell me more", true)).toBeUndefined();
  });
  it("does not present restricted pages as accessible to officers", () => {
    const answer = projectHelp("How do I import a URL?", false);
    expect(answer?.answer).toContain("requires Collector");
    expect(answer?.sources).toEqual([]);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

// Sample shaped exactly like the Spring Boot responses seen in development.
const incidents = [
  {
    id: 48,
    title: "Tamil Nadu CM Vijay inaugurates development projects worth ₹68 crore in Pudukkottai",
    category: "Government administration",
    severity: "Low",
    taluk: "unknown",
    firstReportedAt: "2026-11-02T20:39:27",
    latestReportedAt: "2026-11-06T05:01:10",
    articleCount: 5,
    priority: "Medium",
    priorityReason: "Severity Low (+1), 5 related reports (+2), not reported recently (+0) = 3",
    reviewStatus: "UNREVIEWED",
  },
  {
    id: 54,
    title: "Villagers stage road blockade over nursing student’s death in Pudukottai",
    category: "Public safety",
    severity: "High",
    taluk: "unknown",
    firstReportedAt: "2026-11-03T20:37:11",
    latestReportedAt: "2026-11-03T20:37:11",
    articleCount: 1,
    priority: "High",
    priorityReason: "Severity High (+4)",
    reviewStatus: "UNREVIEWED",
  },
];
const articles = [
  {
    id: 1,
    title: "CM Vijay Holds Roadshow in Pudukkottai - Deccan Chronicle",
    url: "https://news.google.com/x",
    source: "Deccan Chronicle",
    publishedAt: "2026-11-02T13:05:56",
    collectedAt: "2026-11-07T08:50:17",
    processingStatus: "PROCESSED",
    category: "Government administration",
    severity: "Low",
    taluk: "unknown",
    summary: "[DEMO SUMMARY] x",
    incidentId: 48,
  },
  {
    id: 2,
    title: "Mahindra XUV On Road Price in Pudukkottai - CarDekho",
    url: "https://news.google.com/y",
    source: "CarDekho",
    publishedAt: "2026-11-02T22:04:19",
    collectedAt: "2026-11-07T08:50:17",
    processingStatus: "PROCESSED",
    category: "Not relevant",
    severity: "Low",
    taluk: "unknown",
    summary: "",
    incidentId: null,
  },
];

const get = vi.fn(async (url: string) => {
  if (url === "/incidents") return { data: incidents };
  if (url === "/news") return { data: articles };
  if (url === "/incidents/48") return { data: { incident: incidents[0], articles: [articles[0]] } };
  throw new Error("unexpected " + url);
});
vi.mock("axios", () => ({ default: { create: () => ({ get }) } }));

beforeEach(() => vi.stubEnv("VITE_LIVE_API_BASE_URL", "http://localhost:8081/api"));

describe("live adapter", () => {
  it("maps incidents to the frontend shape without inventing facts", async () => {
    const live = await import("@/services/live/live");
    const list = await live.liveIncidentService.list();
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({
      id: "LIVE-48",
      category: "governance",
      priority: "medium",
      isDemo: false,
      sourceCount: 5,
    });
    expect(list[0]!.location).toEqual({
      name: "Location not stated in report",
      taluk: "Unresolved",
      resolved: false,
    });
    expect(list[1]).toMatchObject({ category: "public_safety", priority: "high" });
  });

  it("filters irrelevant articles and strips the source suffix", async () => {
    const live = await import("@/services/live/live");
    const list = await live.liveNewsService.listArticles();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: "LIVE-A1",
      headline: "CM Vijay Holds Roadshow in Pudukkottai",
      incidentId: "LIVE-48",
      processingStatus: "processed",
    });
  });

  it("builds clusters only for incidents with several reports and loads incident detail", async () => {
    const live = await import("@/services/live/live");
    const clusters = await live.liveNewsService.listClusters();
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toMatchObject({ incidentId: "LIVE-48", articleIds: ["LIVE-A1"] });
    const detail = await live.liveIncidentService.get("LIVE-48");
    expect(detail.incident.articleIds).toEqual(["LIVE-A1"]);
    expect(await live.liveNewsService.getInsights()).toBeNull();
  });

  it("builds the Overview from live records only", async () => {
    const live = await import("@/services/live/live");
    const o = await live.liveDashboardService.getOverview();
    expect(o.kpis.activeIncidents).toBe(2);
    expect(o.kpis.highPriority).toBe(1);
    expect(o.kpis.weatherAlerts).toBe(0);
    expect(o.kpis.newsAnalyzed).toBe(1);
    expect(o.byCategory.map((c) => c.category).sort()).toEqual(["governance", "public_safety"]);
    expect(o.daily).toHaveLength(30);
    expect(o.summaries).toEqual([]);
    expect(o.departments).toEqual([]);
    expect(o.sourceHealth.sources[0]!.recordsCollected).toBe(1);
  });
});

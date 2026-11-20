// MOCK report generation. Builds a structured report from demo records; sections are tagged
// as verified data, AI-generated or raw data so the UI and exports can distinguish them.
import type { GeneratedReport, Incident, ReportRequest, ReportSection, ReportType } from "@/types";
import { buildSummaries, departmentStats, isActiveIncident } from "./analytics";
import { DISTRICTS, departmentName } from "./data/reference";
import { buildAgriculture, buildWeather } from "./data/sectors";
import { latency, mockDb } from "./store";

export const REPORT_TITLES: Record<ReportType, string> = {
  daily: "Daily District Intelligence Briefing",
  weekly: "Weekly District Intelligence Report",
  monthly: "Monthly Intelligence Summary",
  critical: "Critical Incident Report",
  department: "Department-wise Report",
  news_trend: "News Trend Report",
  weather: "Weather Alert Report",
  agriculture: "Agriculture Intelligence Report",
};

const day = (iso: string) =>
  new Date(new Date(iso).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);

function filterIncidents(all: Incident[], r: ReportRequest) {
  return all.filter((i) => {
    const d = day(i.reportedDate);
    if (d < r.from || d > r.to) return false;
    if (r.categories.length && !r.categories.includes(i.category)) return false;
    if (r.departmentIds.length && !r.departmentIds.includes(i.departmentId)) return false;
    if (r.priorities.length && !r.priorities.includes(i.priority)) return false;
    if (r.type === "critical" && i.priority !== "critical") return false;
    if (r.type === "weather" && i.category !== "weather" && i.category !== "flood") return false;
    if (r.type === "agriculture" && i.category !== "agriculture") return false;
    return true;
  });
}

const incTable = (list: Incident[]) => ({
  columns: ["ID", "Title", "Category", "Location", "Priority", "Department", "Status"],
  rows: list.map((i) => [
    i.id,
    i.title,
    i.category,
    i.location.name,
    i.priority,
    departmentName(i.departmentId),
    i.status.replace(/_/g, " "),
  ]),
});

export const mockReportService = {
  async generate(districtId: string, r: ReportRequest): Promise<GeneratedReport> {
    await latency(700);
    const db = mockDb();
    const district = DISTRICTS.find((d) => d.id === districtId);
    const base = {
      title: REPORT_TITLES[r.type],
      district: `${district?.name ?? districtId}${district?.isDemo ? " (Demo district)" : ""}`,
      generatedAt: new Date().toISOString(),
      period: `${r.from} to ${r.to}`,
    };
    if (districtId !== "vellanadu-demo")
      return {
        ...base,
        sections: [
          {
            heading: "No data",
            kind: "data",
            paragraphs: ["No records are configured for this district yet."],
          },
        ],
      };

    const incidents = filterIncidents(
      db.incidents.filter((i) => i.verification !== "rejected"),
      r,
    );
    const verified = incidents.filter((i) => i.verification === "verified");
    const unverified = incidents.filter((i) => i.verification !== "verified");
    const sections: ReportSection[] = [
      {
        heading: "Summary of records",
        kind: "data",
        paragraphs: [
          `${incidents.length} incident(s) in scope: ${verified.length} verified, ${unverified.length} AI-extracted or pending review. ${incidents.filter(isActiveIncident).length} remain active.`,
        ],
      },
      { heading: "Verified incidents", kind: "verified", table: incTable(verified) },
    ];
    if (unverified.length)
      sections.push({
        heading: "Unverified (AI-extracted / needs review)",
        kind: "ai",
        table: incTable(unverified),
      });

    const summaries = buildSummaries(incidents).slice(0, 5);
    if (summaries.length)
      sections.push({
        heading: "AI-generated assessment",
        kind: "ai",
        paragraphs: summaries.map(
          (s) =>
            `${s.title} — ${s.whyImportant} Suggested follow-up: ${s.followUp} (confidence ${Math.round(s.confidence * 100)}%, ${s.supportingArticleIds.length} supporting reports)`,
        ),
      });

    if (r.type === "department" || r.type === "weekly" || r.type === "monthly") {
      const stats = departmentStats(db.incidents, db.actions).filter(
        (s) => !r.departmentIds.length || r.departmentIds.includes(s.departmentId),
      );
      sections.push({
        heading: "Department performance",
        kind: "data",
        table: {
          columns: ["Department", "Active", "Critical", "Pending actions", "Completed actions"],
          rows: stats.map((s) => [
            s.department,
            s.activeIncidents,
            s.critical,
            s.pendingActions,
            s.completedActions,
          ]),
        },
      });
    }
    if (r.type === "weather" || r.type === "daily") {
      const w = buildWeather();
      sections.push({
        heading: "Weather warnings",
        kind: "data",
        table: {
          columns: ["Warning", "Level", "Areas", "Source", "Active"],
          rows: w.warnings.map((x) => [
            x.title,
            x.level,
            x.areas.join(", "),
            x.source,
            x.active ? "Yes" : "No",
          ]),
        },
      });
    }
    if (r.type === "agriculture") {
      const a = buildAgriculture();
      sections.push({
        heading: "Commodity prices (latest)",
        kind: "data",
        table: {
          columns: ["Commodity", "Market", "Modal price", "Change %"],
          rows: a.latestPrices.map((p) => [
            p.commodity,
            p.market,
            `${p.modalPrice} ${p.unit}`,
            p.changePct ?? "Unavailable",
          ]),
        },
      });
    }
    if (r.type === "news_trend") {
      const arts = db.articles.filter(
        (a) => day(a.publishedDate) >= r.from && day(a.publishedDate) <= r.to,
      );
      const bySource = new Map<string, number>();
      arts.forEach((a) => bySource.set(a.source, (bySource.get(a.source) ?? 0) + 1));
      sections.push({
        heading: "Articles by source",
        kind: "data",
        table: { columns: ["Source", "Articles"], rows: [...bySource.entries()] },
      });
    }
    sections.push({
      heading: "Data notice",
      kind: "data",
      paragraphs: [
        "DEMO DATA: all records in this report are fictional and for demonstration only. AI-generated content must be verified against source evidence before administrative use.",
      ],
    });
    return { ...base, sections };
  },
};

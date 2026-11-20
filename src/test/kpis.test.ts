import { describe, expect, it, vi } from "vitest";
import type { ActionItem, Incident, NewsArticle, WeatherWarning } from "@/types";
import { computeKpis, isActiveIncident } from "@/services/mock/analytics";
import { mockDashboardService } from "@/services/mock/dashboard.mock";
import { mockIncidentService } from "@/services/mock/intel.mock";
import { mockActionService } from "@/services/mock/operations.mock";
import { isOverdue } from "@/lib/format";

const inc = (p: Partial<Incident>): Incident =>
  ({
    id: "I",
    status: "new",
    verification: "verified",
    priority: "medium",
    reportedDate: "2026-11-05T04:00:00.000Z",
    ...p,
  }) as Incident;
const act = (status: ActionItem["status"]): ActionItem => ({ id: "A", status }) as ActionItem;
const art = (processingStatus: NewsArticle["processingStatus"]): NewsArticle =>
  ({ id: "N", processingStatus }) as NewsArticle;
const warn = (active: boolean): WeatherWarning => ({ id: "W", active }) as WeatherWarning;

describe("KPI rules", () => {
  it("active incidents exclude resolved, closed and rejected", () => {
    const k = computeKpis(
      [
        inc({}),
        inc({ status: "resolved" }),
        inc({ status: "closed" }),
        inc({ verification: "rejected" }),
        inc({ status: "under_investigation" }),
      ],
      [],
      [],
      [],
    );
    expect(k.activeIncidents).toBe(2);
  });

  it("critical and high counts only include active incidents", () => {
    const k = computeKpis(
      [
        inc({ priority: "critical" }),
        inc({ priority: "critical", status: "resolved" }),
        inc({ priority: "high" }),
        inc({ priority: "high", verification: "rejected" }),
      ],
      [],
      [],
      [],
    );
    expect(k.criticalIncidents).toBe(1);
    expect(k.highPriority).toBe(1);
  });

  it("pending actions are every action that is not completed", () => {
    const k = computeKpis(
      [],
      [act("open"), act("in_progress"), act("under_review"), act("on_hold"), act("completed")],
      [],
      [],
    );
    expect(k.pendingActions).toBe(4);
  });

  it("news analysed counts processed and duplicate-grouped articles only", () => {
    const k = computeKpis(
      [],
      [],
      [art("processed"), art("duplicate"), art("pending"), art("failed")],
      [],
    );
    expect(k.newsAnalyzed).toBe(2);
  });

  it("weather alerts count only active warnings", () => {
    expect(computeKpis([], [], [], [warn(true), warn(true), warn(false)]).weatherAlerts).toBe(2);
  });

  it("an action is overdue only when not completed and due before today", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-06T06:00:00Z"));
      expect(isOverdue("2026-11-01", "open")).toBe(true);
      expect(isOverdue("2026-11-01", "completed")).toBe(false);
      expect(isOverdue("2026-11-06", "open")).toBe(false);
      vi.setSystemTime(new Date("2026-11-16T06:00:00Z"));
      expect(isOverdue("2026-11-06", "open")).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Overview numbers match the module records", () => {
  it("KPIs equal counts taken from the incident and action lists", async () => {
    const [overview, incidents, actions] = await Promise.all([
      mockDashboardService.getOverview("vellanadu-demo"),
      mockIncidentService.list("vellanadu-demo"),
      mockActionService.list("vellanadu-demo"),
    ]);
    const active = incidents.filter(isActiveIncident);
    expect(overview.kpis.activeIncidents).toBe(active.length);
    expect(overview.kpis.criticalIncidents).toBe(
      active.filter((i) => i.priority === "critical").length,
    );
    expect(overview.kpis.pendingActions).toBe(
      actions.filter((a) => a.status !== "completed").length,
    );
    const catTotal = overview.byCategory.reduce((s, c) => s + c.count, 0);
    expect(catTotal).toBe(incidents.filter((i) => i.verification !== "rejected").length);
  });

  it("a district without data returns zeros, not demo numbers", async () => {
    const o = await mockDashboardService.getOverview("kaveripuram-demo");
    expect(o.kpis.activeIncidents).toBe(0);
    expect(o.criticalAlerts).toHaveLength(0);
  });
});

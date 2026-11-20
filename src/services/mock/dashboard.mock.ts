// MOCK dashboard / overview / notifications / search services (demo data only).
import type { NotificationItem, OverviewData, SearchResult } from "@/types";
import { buildWeather } from "./data/sectors";
import { DEPARTMENTS, DISTRICTS } from "./data/reference";
import {
  buildSummaries,
  categoryCounts,
  computeKpis,
  dailyCounts,
  departmentStats,
  isActiveIncident,
  locationCounts,
  sourceHealth,
  weeklyCounts,
} from "./analytics";
import { clone, forDistrict, latency, mockDb } from "./store";

const PRI = { critical: 0, high: 1, medium: 2, low: 3 } as const;

function emptyOverview(): OverviewData {
  return {
    kpis: {
      activeIncidents: 0,
      criticalIncidents: 0,
      highPriority: 0,
      weatherAlerts: 0,
      pendingActions: 0,
      newsAnalyzed: 0,
      incidentsLast7: 0,
      incidentsPrev7: 0,
    },
    criticalAlerts: [],
    daily: dailyCounts([]),
    weekly: weeklyCounts([]),
    byCategory: categoryCounts([]),
    byLocation: [],
    departments: [],
    summaries: [],
    recentNews: [],
    sourceHealth: sourceHealth([]),
  };
}

export const mockConfigService = {
  async getDistricts() {
    await latency(120);
    return clone(DISTRICTS);
  },
};

export const mockDashboardService = {
  async getOverview(districtId: string): Promise<OverviewData> {
    await latency();
    const db = mockDb();
    const weather = buildWeather();
    const data: OverviewData = {
      kpis: computeKpis(db.incidents, db.actions, db.articles, weather.warnings),
      criticalAlerts: db.incidents
        .filter((i) => isActiveIncident(i) && (i.priority === "critical" || i.priority === "high"))
        .sort(
          (a, b) =>
            PRI[a.priority] - PRI[b.priority] || b.reportedDate.localeCompare(a.reportedDate),
        )
        .slice(0, 6),
      daily: dailyCounts(db.incidents),
      weekly: weeklyCounts(db.incidents),
      byCategory: categoryCounts(db.incidents),
      byLocation: locationCounts(db.incidents),
      departments: departmentStats(db.incidents, db.actions),
      summaries: buildSummaries(db.incidents).slice(0, 4),
      recentNews: db.articles.filter((a) => a.processingStatus === "processed").slice(0, 6),
      sourceHealth: sourceHealth(db.sources),
    };
    return forDistrict(districtId, clone(data), emptyOverview());
  },

  async getNotifications(districtId: string): Promise<NotificationItem[]> {
    await latency(150);
    const db = mockDb();
    const items: NotificationItem[] = db.incidents
      .filter((i) => isActiveIncident(i) && i.priority === "critical")
      .map((i, k) => ({
        id: `N-${i.id}`,
        title: `Critical: ${i.title}`,
        detail: `${i.location.name} · ${i.sourceCount} source(s)`,
        date: i.reportedDate,
        priority: i.priority,
        link: `/incidents/${i.id}`,
        read: k > 1,
      }));
    db.actions
      .filter((a) => a.status !== "completed" && a.dueDate < "2026-11-06")
      .slice(0, 3)
      .forEach((a) =>
        items.push({
          id: `N-${a.id}`,
          title: `Overdue action: ${a.title}`,
          detail: `Due ${a.dueDate}`,
          date: a.createdAt,
          priority: a.priority,
          link: "/actions",
          read: true,
        }),
      );
    return forDistrict(districtId, items, []);
  },

  async search(districtId: string, q: string): Promise<SearchResult[]> {
    await latency(120);
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const db = mockDb();
    const match = (...s: (string | undefined)[]) => s.some((x) => x?.toLowerCase().includes(term));
    const results: SearchResult[] = [
      ...db.incidents
        .filter((i) => match(i.id, i.title, i.location.name, i.category))
        .slice(0, 6)
        .map((i) => ({
          type: "incident" as const,
          id: i.id,
          title: i.title,
          subtitle: `${i.id} · ${i.location.name}`,
          link: `/incidents/${i.id}`,
        })),
      ...db.articles
        .filter((a) => match(a.headline, a.source))
        .slice(0, 4)
        .map((a) => ({
          type: "article" as const,
          id: a.id,
          title: a.headline,
          subtitle: a.source,
          link: `/news?q=${encodeURIComponent(a.headline)}`,
        })),
      ...db.actions
        .filter((a) => match(a.id, a.title))
        .slice(0, 3)
        .map((a) => ({
          type: "action" as const,
          id: a.id,
          title: a.title,
          subtitle: a.id,
          link: `/actions?q=${encodeURIComponent(a.title)}`,
        })),
      ...DEPARTMENTS.filter((d) => match(d.name, d.shortName))
        .slice(0, 3)
        .map((d) => ({
          type: "department" as const,
          id: d.id,
          title: d.name,
          subtitle: d.headDesignation,
          link: `/departments/${d.id}`,
        })),
    ];
    return forDistrict(districtId, results, []);
  },
};

// Derivations that the backend would normally compute. Every chart/count comes from the same records.
import type {
  ActionItem,
  AIStructuredSummary,
  Category,
  DataSource,
  DepartmentStats,
  Incident,
  KpiSummary,
  NewsArticle,
  NewsCluster,
  NewsInsights,
  SourceHealth,
  WeatherWarning,
} from "@/types";
import { DEPARTMENTS, demoDay, departmentName } from "./data/reference";

export const CATEGORIES: Category[] = [
  "flood",
  "weather",
  "agriculture",
  "infrastructure",
  "grievance",
  "health",
  "education",
];

export const isActiveIncident = (i: Incident) =>
  i.status !== "resolved" && i.status !== "closed" && i.verification !== "rejected";

export const isPendingAction = (a: ActionItem) => a.status !== "completed";

const dayOf = (iso: string) => {
  const d = new Date(iso);
  // IST calendar day
  return new Date(d.getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
};

export function computeKpis(
  incidents: Incident[],
  actions: ActionItem[],
  articles: NewsArticle[],
  warnings: WeatherWarning[],
): KpiSummary {
  const active = incidents.filter(isActiveIncident);
  const valid = incidents.filter((i) => i.verification !== "rejected");
  const last7 = new Set(Array.from({ length: 7 }, (_, i) => demoDay(i)));
  const prev7 = new Set(Array.from({ length: 7 }, (_, i) => demoDay(i + 7)));
  return {
    activeIncidents: active.length,
    criticalIncidents: active.filter((i) => i.priority === "critical").length,
    highPriority: active.filter((i) => i.priority === "high").length,
    weatherAlerts: warnings.filter((w) => w.active).length,
    pendingActions: actions.filter(isPendingAction).length,
    newsAnalyzed: articles.filter(
      (a) => a.processingStatus === "processed" || a.processingStatus === "duplicate",
    ).length,
    incidentsLast7: valid.filter((i) => last7.has(dayOf(i.reportedDate))).length,
    incidentsPrev7: valid.filter((i) => prev7.has(dayOf(i.reportedDate))).length,
  };
}

export function dailyCounts(incidents: Incident[], days = 30) {
  const valid = incidents.filter((i) => i.verification !== "rejected");
  return Array.from({ length: days }, (_, k) => {
    const date = demoDay(days - 1 - k);
    return { date, count: valid.filter((i) => dayOf(i.reportedDate) === date).length };
  });
}

export function weeklyCounts(incidents: Incident[]) {
  const daily = dailyCounts(incidents, 28);
  return [0, 1, 2, 3].map((w) => ({
    week: `Week ${w + 1}`,
    count: daily.slice(w * 7, w * 7 + 7).reduce((s, d) => s + d.count, 0),
  }));
}

export function categoryCounts(incidents: Incident[]) {
  const valid = incidents.filter((i) => i.verification !== "rejected");
  return CATEGORIES.map((category) => ({
    category,
    count: valid.filter((i) => i.category === category).length,
  }));
}

export function locationCounts(incidents: Incident[]) {
  const map = new Map<string, number>();
  incidents
    .filter((i) => i.verification !== "rejected")
    .forEach((i) => {
      const key = i.location.resolved ? i.location.taluk : "Unresolved";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
  return [...map.entries()]
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);
}

export function departmentStats(incidents: Incident[], actions: ActionItem[]): DepartmentStats[] {
  return DEPARTMENTS.map((d) => {
    const inc = incidents.filter((i) => i.departmentId === d.id && isActiveIncident(i));
    const act = actions.filter((a) => a.departmentId === d.id);
    const dates = [
      ...incidents
        .filter((i) => i.departmentId === d.id)
        .flatMap((i) => i.history.map((h) => h.date)),
      ...act.map((a) => a.createdAt),
    ].sort();
    return {
      departmentId: d.id,
      department: d.name,
      shortName: d.shortName,
      activeIncidents: inc.length,
      pendingActions: act.filter(isPendingAction).length,
      completedActions: act.filter((a) => a.status === "completed").length,
      highPriority: inc.filter((i) => i.priority === "high").length,
      critical: inc.filter((i) => i.priority === "critical").length,
      latestUpdate: dates.at(-1),
    };
  });
}

export function sourceHealth(sources: DataSource[]): SourceHealth {
  const synced = sources
    .map((s) => s.lastSync)
    .filter(Boolean)
    .sort() as string[];
  return {
    connected: sources.filter((s) => s.status === "connected").length,
    failed: sources.filter((s) => s.status === "failed").length,
    disabled: sources.filter((s) => s.status === "disabled").length,
    pending: sources.filter((s) => s.status === "pending").length,
    lastSync: synced.at(-1),
    sources,
  };
}

export function buildClusters(incidents: Incident[], articles: NewsArticle[]): NewsCluster[] {
  return incidents
    .filter((i) => i.articleIds.length > 1)
    .map((i) => {
      const arts = articles
        .filter((a) => i.articleIds.includes(a.id))
        .sort((a, b) => a.publishedDate.localeCompare(b.publishedDate));
      return {
        id: `CL-${i.id.split("-").at(-1)}`,
        incidentId: i.id,
        title: i.title,
        articleIds: arts.map((a) => a.id),
        sources: [...new Set(arts.map((a) => a.source))],
        combinedSummary: i.aiSummary,
        firstReported: arts[0]!.publishedDate,
        latestReported: arts.at(-1)!.publishedDate,
        category: i.category,
        priority: i.priority,
      };
    });
}

export function buildInsights(incidents: Incident[], articles: NewsArticle[]): NewsInsights {
  const valid = incidents.filter((i) => i.verification !== "rejected");
  const recurring = [
    { label: "Flooding and waterlogging", category: "flood" as Category },
    { label: "Disease outbreaks (vector/water-borne)", category: "health" as Category },
    { label: "Road and bridge damage", category: "infrastructure" as Category },
    { label: "Crop and procurement issues", category: "agriculture" as Category },
  ].map((r) => ({ ...r, count: valid.filter((i) => i.category === r.category).length }));
  const deptMap = new Map<string, number>();
  valid.forEach((i) => deptMap.set(i.departmentId, (deptMap.get(i.departmentId) ?? 0) + 1));
  const locMap = new Map<string, number>();
  valid
    .filter((i) => i.location.resolved)
    .forEach((i) => locMap.set(i.location.name, (locMap.get(i.location.name) ?? 0) + 1));
  const recentFlood = valid.filter((i) => i.category === "flood" && isActiveIncident(i)).length;
  const healthWater = valid.filter((i) => i.category === "health" && isActiveIncident(i)).length;
  const dev = articles
    .filter((a) => !a.incidentId && a.processingStatus === "processed")
    .slice(0, 4);
  return {
    recurringIssues: recurring.sort((a, b) => b.count - a.count),
    emergingPatterns: [
      {
        label: "Rain-linked incidents rising",
        detail: `${recentFlood} active flood-related incidents, concentrated in the last 5 days alongside an active heavy-rain alert.`,
      },
      {
        label: "Water supply → health linkage",
        detail: `Melpettai shows a supply disruption followed by diarrhoea cases; ${healthWater} active health incidents overall.`,
      },
      {
        label: "Procurement pressure during harvest",
        detail:
          "Procurement backlog and crop damage reports coincide with rainfall, raising stored-paddy risk.",
      },
    ],
    frequentLocations: [...locMap.entries()]
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    categoryFrequency: categoryCounts(incidents).sort((a, b) => b.count - a.count),
    departmentConcerns: [...deptMap.entries()]
      .map(([departmentId, count]) => ({
        departmentId,
        department: departmentName(departmentId),
        count,
      }))
      .sort((a, b) => b.count - a.count),
    developments: dev.map((a) => ({ label: a.headline, detail: a.aiSummary, articleId: a.id })),
  };
}

export function buildSummaries(incidents: Incident[]): AIStructuredSummary[] {
  return incidents
    .filter(
      (i) =>
        isActiveIncident(i) &&
        (i.priority === "critical" || i.priority === "high") &&
        i.articleIds.length >= 2,
    )
    .sort((a, b) =>
      a.priority === b.priority
        ? b.articleIds.length - a.articleIds.length
        : a.priority === "critical"
          ? -1
          : 1,
    )
    .map((i) => ({
      id: `SUM-${i.id}`,
      title: i.title,
      whatHappened: i.description,
      where: `${i.location.name}${i.location.resolved ? `, ${i.location.taluk} taluk` : " — location unresolved"}`,
      when: i.reportedDate,
      whyImportant:
        i.priority === "critical"
          ? "Critical priority: risk to life, health or large-scale property; multiple independent reports."
          : "High priority: significant public impact reported by multiple sources.",
      pattern:
        i.relatedIncidentIds.length > 0
          ? `Linked to ${i.relatedIncidentIds.length} related incident(s): ${i.relatedIncidentIds.join(", ")}.`
          : "No linked incidents detected in the last 30 days.",
      department: departmentName(i.departmentId),
      followUp:
        i.status === "new"
          ? `Assign to ${departmentName(i.departmentId)} and request a field verification report within 24 hours.`
          : `Request a status update from ${departmentName(i.departmentId)} and confirm timelines for closure.`,
      confidence: i.confidence,
      supportingArticleIds: i.articleIds,
      incidentIds: [i.id, ...i.relatedIncidentIds],
      category: i.category,
      priority: i.priority,
    }));
}

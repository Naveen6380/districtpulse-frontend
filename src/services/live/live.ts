// Legacy migration adapter retained for old fixtures; the live application now uses the authenticated DTO services.
// LIVE adapter: maps the DistrictPulse Spring Boot backend (Pudukkottai) to the Lovable DTOs.
// Only incidents and news are live. Everything else in the app stays on clearly labelled demo data.
// Nothing here invents facts: fields the backend does not provide are left empty or marked unresolved.
import axios from "axios";
import { locationCounts } from "@/services/mock/analytics";
import type {
  Category,
  GeoLocation,
  Incident,
  NewsArticle,
  NewsCluster,
  NewsInsights,
  AIStructuredSummary,
  OverviewData,
  DataSource,
  DataSourceInput,
  SyncLog,
  Priority,
  ProcessingStatus,
  VerificationStatus,
} from "@/types";

export const LIVE_DISTRICT_ID = "pudukkottai";
export const LIVE_API_BASE_URL = (
  import.meta.env["VITE_LIVE_API_BASE_URL"] as string | undefined
)?.replace(/\/$/, "");
export const LIVE_ENABLED = !!LIVE_API_BASE_URL;

export const isLiveDistrict = (districtId: string) =>
  LIVE_ENABLED && districtId === LIVE_DISTRICT_ID;
export const isLiveIncidentId = (id: string) => id.startsWith("LIVE-");

const liveApi = axios.create({ baseURL: LIVE_API_BASE_URL ?? "", timeout: 20000 });
const getLive = <T>(url: string, params?: object) =>
  liveApi.get<T>(url, { params }).then((r) => r.data);
const postLive = <T>(url: string, body?: unknown) => liveApi.post<T>(url, body).then((r) => r.data);
const putLive = <T>(url: string, body?: unknown) => liveApi.put<T>(url, body).then((r) => r.data);
const patchLive = <T>(url: string, body?: unknown) =>
  liveApi.patch<T>(url, body).then((r) => r.data);

// ---- Backend DTOs (what Spring Boot returns today) ----
interface ApiIncident {
  id: number;
  title: string;
  category: string | null;
  severity: string | null;
  taluk: string | null;
  firstReportedAt: string;
  latestReportedAt: string;
  articleCount: number;
  priority: string | null;
  priorityReason: string | null;
  reviewStatus: string | null;
}

interface ApiArticle {
  id: number;
  title: string;
  url: string;
  source: string | null;
  publishedAt: string | null;
  collectedAt: string | null;
  processingStatus: string | null;
  category: string | null;
  severity: string | null;
  taluk: string | null;
  summary: string | null;
  incidentId: number | null;
}

// ---- Mapping helpers ----
const CATEGORY_MAP: Record<string, Category> = {
  Weather: "weather",
  Health: "health",
  Agriculture: "agriculture",
  Education: "education",
  Infrastructure: "infrastructure",
  "Public safety": "public_safety",
  "Government administration": "governance",
};
const toCategory = (c?: string | null): Category => CATEGORY_MAP[c ?? ""] ?? "other";

const toPriority = (p?: string | null): Priority => {
  const v = (p ?? "").toLowerCase();
  return v === "critical" || v === "high" || v === "medium" ? v : "low";
};

// Default routing rule only. The Collector can reassign (reassignment is not persisted to the live backend yet).
const DEFAULT_DEPARTMENT: Record<Category, string> = {
  flood: "wrd",
  weather: "revenue",
  agriculture: "agri",
  infrastructure: "pwd",
  grievance: "revenue",
  health: "health",
  education: "edu",
  public_safety: "revenue",
  governance: "revenue",
  other: "revenue",
};

const toVerification = (s?: string | null): VerificationStatus => {
  if (s === "VERIFIED") return "verified";
  if (s === "REJECTED") return "rejected";
  if (s === "NEEDS_REVIEW") return "needs_review";
  return "ai_extracted";
};

// Coordinates are never guessed: every live record is "unresolved" until geocoding exists.
const toLocation = (taluk?: string | null): GeoLocation =>
  taluk && taluk !== "unknown"
    ? { name: taluk, taluk, resolved: false }
    : { name: "Location not stated in report", taluk: "Unresolved", resolved: false };

const stripSourceSuffix = (title: string, source?: string | null) =>
  source && title.endsWith(` - ${source}`) ? title.slice(0, -(source.length + 3)) : title;

const toProcessing = (s?: string | null): ProcessingStatus =>
  s === "PROCESSED" ? "processed" : s === "FAILED" ? "failed" : "pending";

const incidentId = (id: number) => `LIVE-${id}`;

function toIncident(a: ApiIncident, articleIds: string[] = []): Incident {
  const category = toCategory(a.category);
  const n = a.articleCount;
  return {
    id: incidentId(a.id),
    title: a.title,
    description: `Grouped automatically from ${n} news report${n === 1 ? "" : "s"}. Open the supporting articles to verify.`,
    aiSummary: `Rule-based grouping (demo mode, no LLM yet). ${a.priorityReason ?? ""}`.trim(),
    category,
    location: toLocation(a.taluk),
    reportedDate: a.firstReportedAt,
    priority: toPriority(a.priority),
    departmentId: DEFAULT_DEPARTMENT[category],
    status: "new",
    verification: toVerification(a.reviewStatus),
    confidence: 0.4, // default of the rule-based extractor; replaced when a real LLM provider is configured
    articleIds,
    sourceCount: n,
    relatedIncidentIds: [],
    history: [
      {
        date: a.firstReportedAt,
        actor: "DistrictPulse pipeline",
        event: "Incident created from grouped news reports",
      },
    ],
    isDemo: false,
  };
}

function toArticle(a: ApiArticle): NewsArticle {
  return {
    id: `LIVE-A${a.id}`,
    headline: stripSourceSuffix(a.title, a.source),
    source: a.source || "Unknown source",
    publishedDate: a.publishedAt ?? a.collectedAt ?? "",
    location: toLocation(a.taluk),
    category: toCategory(a.category),
    priority: toPriority(a.severity),
    aiSummary: a.summary ?? "",
    processingStatus: toProcessing(a.processingStatus),
    url: a.url,
    incidentId: a.incidentId != null ? incidentId(a.incidentId) : undefined,
    clusterId: a.incidentId != null ? `LIVE-CL-${a.incidentId}` : undefined,
    isDemo: false,
  };
}

const isRelevant = (a: ApiArticle) => a.category !== "Not relevant";

// ---- Live services ----
export const liveIncidentService = {
  async list(): Promise<Incident[]> {
    const rows = await getLive<ApiIncident[]>("/incidents");
    return rows.map((r) => toIncident(r));
  },
  async get(
    id: string,
  ): Promise<{ incident: Incident; articles: NewsArticle[]; related: Incident[] }> {
    const raw = id.replace("LIVE-", "");
    const res = await getLive<{ incident: ApiIncident; articles: ApiArticle[] }>(
      `/incidents/${raw}`,
    );
    const articles = res.articles.map(toArticle);
    return {
      incident: toIncident(
        res.incident,
        articles.map((a) => a.id),
      ),
      articles,
      related: [],
    };
  },
};

export const liveNewsService = {
  async listArticles(): Promise<NewsArticle[]> {
    const rows = await getLive<ApiArticle[]>("/news");
    return rows.filter(isRelevant).map(toArticle);
  },
  async listClusters(): Promise<NewsCluster[]> {
    const [incidents, articles] = await Promise.all([
      getLive<ApiIncident[]>("/incidents"),
      getLive<ApiArticle[]>("/news"),
    ]);
    const relevant = articles.filter(isRelevant);
    return incidents
      .filter((i) => i.articleCount > 1)
      .map((i) => {
        const group = relevant.filter((a) => a.incidentId === i.id);
        const sources = Array.from(
          new Set(group.map((a) => a.source).filter((s): s is string => !!s)),
        );
        const inc = toIncident(i);
        return {
          id: `LIVE-CL-${i.id}`,
          incidentId: inc.id,
          title: inc.title,
          articleIds: group.map((a) => `LIVE-A${a.id}`),
          sources,
          combinedSummary: `${i.articleCount} reports from ${sources.length} source${sources.length === 1 ? "" : "s"} were grouped as one incident by title similarity.`,
          firstReported: i.firstReportedAt,
          latestReported: i.latestReportedAt,
          category: inc.category,
          priority: inc.priority,
        };
      });
  },
  // No LLM yet: insights and structured summaries stay empty instead of showing invented text.
  async getInsights(): Promise<NewsInsights | null> {
    return null;
  },
  async getSummaries(): Promise<AIStructuredSummary[]> {
    return [];
  },
};

// ---- Overview, computed from the live records only (no invented numbers) ----
const istDay = (iso: string) =>
  new Date(new Date(iso).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
const daysAgo = (n: number) => istDay(new Date(Date.now() - n * 86400000).toISOString());
const PRI_ORDER = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export const liveDashboardService = {
  async getOverview(): Promise<OverviewData> {
    const [incidents, articles] = await Promise.all([
      liveIncidentService.list(),
      liveNewsService.listArticles(),
    ]);
    const valid = incidents.filter((i) => i.verification !== "rejected");
    const active = valid.filter((i) => i.status !== "resolved" && i.status !== "closed");

    const last7 = new Set(Array.from({ length: 7 }, (_, i) => daysAgo(i)));
    const prev7 = new Set(Array.from({ length: 7 }, (_, i) => daysAgo(i + 7)));
    const daily = Array.from({ length: 30 }, (_, k) => {
      const date = daysAgo(29 - k);
      return { date, count: valid.filter((i) => istDay(i.reportedDate) === date).length };
    });
    const last28 = daily.slice(2);
    const weekly = [0, 1, 2, 3].map((w) => ({
      week: `Week ${w + 1}`,
      count: last28.slice(w * 7, w * 7 + 7).reduce((sum, d) => sum + d.count, 0),
    }));

    const catMap = new Map<Category, number>();
    valid.forEach((i) => catMap.set(i.category, (catMap.get(i.category) ?? 0) + 1));
    const byCategory = [...catMap.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const processed = articles.filter((a) => a.processingStatus === "processed");

    // Real source: the Google News RSS feed the backend collects from. Nothing else is claimed as connected.
    const rss: DataSource = {
      id: "SRC-LIVE-NEWS-RSS",
      name: "Google News RSS (Pudukkottai)",
      url: "https://news.google.com/rss/search?q=Pudukkottai",
      description: "Public news search feed collected by the DistrictPulse backend.",
      category: "news",
      type: "xml",
      coverage: "Pudukkottai district",
      accessMethod: "Public RSS feed",
      authRequired: false,
      frequency: "On demand",
      status: "connected",
      recordsCollected: articles.length,
    };

    return {
      kpis: {
        activeIncidents: active.length,
        criticalIncidents: active.filter((i) => i.priority === "critical").length,
        highPriority: active.filter((i) => i.priority === "high").length,
        weatherAlerts: 0, // weather source not connected yet
        pendingActions: 0, // action tracker not connected yet
        newsAnalyzed: processed.length,
        incidentsLast7: valid.filter((i) => last7.has(istDay(i.reportedDate))).length,
        incidentsPrev7: valid.filter((i) => prev7.has(istDay(i.reportedDate))).length,
      },
      criticalAlerts: active
        .filter((i) => i.priority === "critical" || i.priority === "high")
        .sort(
          (a, b) =>
            PRI_ORDER[a.priority] - PRI_ORDER[b.priority] ||
            b.reportedDate.localeCompare(a.reportedDate),
        )
        .slice(0, 6),
      daily,
      weekly,
      byCategory,
      byLocation: locationCounts(valid),
      departments: [], // routing is a default rule, so no department performance is claimed
      summaries: [], // no LLM yet, so no generated summaries
      recentNews: [...processed]
        .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
        .slice(0, 6),
      sourceHealth: { connected: 1, failed: 0, disabled: 0, pending: 0, sources: [rss] },
    };
  },
};

// ---- Data sources (global, not per district). Credentials are sent once and stored encrypted by the backend. ----
export const liveSourceService = {
  list: () => getLive<DataSource[]>("/sources"),
  create: (input: DataSourceInput) => postLive<DataSource>("/sources", input),
  update: (id: string, input: Partial<DataSourceInput>) =>
    putLive<DataSource>(`/sources/${id}`, input),
  setEnabled: (id: string, enabled: boolean) =>
    patchLive<DataSource>(`/sources/${id}/status`, { enabled }),
  testConnection: (input: Pick<DataSourceInput, "url" | "type">) =>
    postLive<{ ok: boolean; message: string; simulated?: boolean }>("/sources/test", input),
  triggerSync: (id: string) => postLive<SyncLog>(`/sources/${id}/sync`),
  getLogs: (id: string) => getLive<SyncLog[]>(`/sources/${id}/logs`),
};

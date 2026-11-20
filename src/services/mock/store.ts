// In-memory mock database. Built lazily (never at module scope) so it is safe on the edge runtime.
// Mutations here last for the browser session only; real persistence belongs to the Spring Boot backend.
import type {
  ActionItem,
  DashboardPreferences,
  DataSource,
  Incident,
  NewsArticle,
  SyncLog,
} from "@/types";
import { buildIncidentData } from "./data/incidents";
import { buildActions, buildSources, buildSyncLogs } from "./data/operations";
import { DEMO_DISTRICT_ID } from "./data/reference";

interface MockDb {
  incidents: Incident[];
  articles: NewsArticle[];
  actions: ActionItem[];
  sources: DataSource[];
  syncLogs: SyncLog[];
}

let db: MockDb | null = null;

export function mockDb(): MockDb {
  if (!db) {
    const { incidents, articles } = buildIncidentData();
    db = {
      incidents: structuredClone(incidents),
      articles: structuredClone(articles),
      actions: buildActions(),
      sources: buildSources(),
      syncLogs: buildSyncLogs(),
    };
  }
  return db;
}

/** Simulated network latency so loading states are exercised. */
export const latency = (ms = 280) => new Promise<void>((r) => setTimeout(r, ms));

/** Demo data exists only for the fictional demo district; other districts return empty results. */
export function forDistrict<T>(districtId: string, value: T, empty: T): T {
  return districtId === DEMO_DISTRICT_ID ? value : empty;
}

export const clone = <T>(v: T): T => structuredClone(v);

export function nextId(prefix: string, existing: { id: string }[]) {
  const nums = existing
    .map((e) => parseInt(e.id.replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  return `${prefix}-${(nums.length ? Math.max(...nums) : 100) + 1}`;
}

export const PREFS_KEY = "dp.dashboardPrefs";
export const DEFAULT_PREFERENCES: DashboardPreferences = {
  widgets: [
    "incident_overview",
    "critical_alerts",
    "trend_analysis",
    "weather_summary",
    "action_tracker",
    "source_health",
  ],
  categories: [],
  locations: [],
  alerts: { critical: true, high: true, weather: true, overdueActions: true, email: false },
};

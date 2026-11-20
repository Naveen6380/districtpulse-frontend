// MOCK news, incidents and map services (demo data only).
import type {
  Incident,
  NewsArticle,
  NewsCluster,
  NewsInsights,
  AIStructuredSummary,
  VerificationStatus,
  WeatherWarning,
} from "@/types";
import { buildClusters, buildInsights, buildSummaries } from "./analytics";
import { buildWeather } from "./data/sectors";
import { LOCATIONS } from "./data/reference";
import { clone, forDistrict, latency, mockDb } from "./store";

export const mockNewsService = {
  async listArticles(districtId: string): Promise<NewsArticle[]> {
    await latency();
    return forDistrict(districtId, clone(mockDb().articles), []);
  },
  async listClusters(districtId: string): Promise<NewsCluster[]> {
    await latency();
    const db = mockDb();
    return forDistrict(districtId, buildClusters(db.incidents, db.articles), []);
  },
  async getInsights(districtId: string): Promise<NewsInsights | null> {
    await latency();
    const db = mockDb();
    return forDistrict(districtId, buildInsights(db.incidents, db.articles), null);
  },
  async getSummaries(districtId: string): Promise<AIStructuredSummary[]> {
    await latency();
    return forDistrict(districtId, buildSummaries(mockDb().incidents), []);
  },
};

export const mockIncidentService = {
  async list(districtId: string): Promise<Incident[]> {
    await latency();
    return forDistrict(districtId, clone(mockDb().incidents), []);
  },
  async get(
    id: string,
  ): Promise<{ incident: Incident; articles: NewsArticle[]; related: Incident[] }> {
    await latency();
    const db = mockDb();
    const incident = db.incidents.find((i) => i.id === id);
    if (!incident) throw new Error(`Incident ${id} not found`);
    const related = db.incidents.filter(
      (i) =>
        i.id !== id &&
        (incident.relatedIncidentIds.includes(i.id) || i.relatedIncidentIds.includes(id)),
    );
    return clone({
      incident,
      articles: db.articles.filter((a) => incident.articleIds.includes(a.id)),
      related,
    });
  },
  async setVerification(
    id: string,
    verification: VerificationStatus,
    note?: string,
  ): Promise<Incident> {
    await latency(350);
    const inc = mockDb().incidents.find((i) => i.id === id);
    if (!inc) throw new Error("Incident not found");
    inc.verification = verification;
    const label = {
      verified: "Marked as verified",
      needs_review: "Flagged: needs review",
      rejected: "Rejected",
      ai_extracted: "Reset to AI-extracted",
    }[verification];
    inc.history.push({
      date: new Date().toISOString(),
      actor: "Collector's Office",
      event: note ? `${label} — ${note}` : label,
    });
    return clone(inc);
  },
  async assignDepartment(id: string, departmentId: string): Promise<Incident> {
    await latency(350);
    const inc = mockDb().incidents.find((i) => i.id === id);
    if (!inc) throw new Error("Incident not found");
    inc.departmentId = departmentId;
    if (inc.status === "new") inc.status = "action_assigned";
    inc.history.push({
      date: new Date().toISOString(),
      actor: "Collector's Office",
      event: `Reassigned to department: ${departmentId}`,
    });
    return clone(inc);
  },
};

export interface MapOverlay {
  id: string;
  label: string;
  level: WeatherWarning["level"];
  lat: number;
  lng: number;
  radiusKm: number;
}

export const mockMapService = {
  async getMapData(districtId: string): Promise<{ incidents: Incident[]; overlays: MapOverlay[] }> {
    await latency();
    const db = mockDb();
    const warnings = buildWeather().warnings.filter((w) => w.active);
    const overlays: MapOverlay[] = [];
    warnings.forEach((w) =>
      w.areas.forEach((area) => {
        const loc = Object.values(LOCATIONS).find(
          (l) => l.resolved && l.taluk === area && l.name.startsWith(area.split(" ")[0] ?? area),
        );
        if (loc?.lat && loc.lng)
          overlays.push({
            id: `${w.id}-${area}`,
            label: `${w.title} (${area})`,
            level: w.level,
            lat: loc.lat,
            lng: loc.lng,
            radiusKm: 7,
          });
      }),
    );
    return forDistrict(
      districtId,
      clone({ incidents: db.incidents.filter((i) => i.verification !== "rejected"), overlays }),
      { incidents: [], overlays: [] },
    );
  },
};

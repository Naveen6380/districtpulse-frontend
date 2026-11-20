// MOCK actions, data sources and dashboard-preference services (demo data only).
import type {
  ActionInput,
  ActionItem,
  ActionStatus,
  DashboardPreferences,
  DataSource,
  DataSourceInput,
  SyncLog,
} from "@/types";
import {
  clone,
  DEFAULT_PREFERENCES,
  forDistrict,
  latency,
  mockDb,
  nextId,
  PREFS_KEY,
} from "./store";

export const mockActionService = {
  async list(districtId: string): Promise<ActionItem[]> {
    await latency();
    return forDistrict(districtId, clone(mockDb().actions), []);
  },
  async create(input: ActionInput): Promise<ActionItem> {
    await latency(350);
    const db = mockDb();
    const item: ActionItem = {
      ...input,
      id: nextId("ACT", db.actions),
      status: "open",
      createdAt: new Date().toISOString(),
      comments: [],
    };
    db.actions.unshift(item);
    return clone(item);
  },
  async update(
    id: string,
    patch: Partial<ActionInput> & { status?: ActionStatus },
  ): Promise<ActionItem> {
    await latency(250);
    const a = mockDb().actions.find((x) => x.id === id);
    if (!a) throw new Error("Action not found");
    Object.assign(a, patch);
    if (patch.status === "completed") a.completedAt = new Date().toISOString();
    if (patch.status && patch.status !== "completed") a.completedAt = undefined;
    return clone(a);
  },
  async addComment(id: string, author: string, text: string): Promise<ActionItem> {
    await latency(200);
    const a = mockDb().actions.find((x) => x.id === id);
    if (!a) throw new Error("Action not found");
    a.comments.push({ id: `C-${Date.now()}`, author, text, date: new Date().toISOString() });
    return clone(a);
  },
};

export const mockSourceService = {
  async list(): Promise<DataSource[]> {
    await latency();
    return clone(mockDb().sources);
  },
  async create(input: DataSourceInput): Promise<DataSource> {
    await latency(400);
    const db = mockDb();
    const src: DataSource = {
      ...input,
      id: nextId("SRC", db.sources),
      status: "pending",
      recordsCollected: 0,
    };
    db.sources.push(src);
    return clone(src);
  },
  async update(id: string, input: Partial<DataSourceInput>): Promise<DataSource> {
    await latency(300);
    const s = mockDb().sources.find((x) => x.id === id);
    if (!s) throw new Error("Source not found");
    Object.assign(s, input);
    return clone(s);
  },
  async setEnabled(id: string, enabled: boolean): Promise<DataSource> {
    await latency(250);
    const s = mockDb().sources.find((x) => x.id === id);
    if (!s) throw new Error("Source not found");
    s.status = enabled ? "pending" : "disabled";
    if (!enabled) s.nextSync = undefined;
    return clone(s);
  },
  /** Simulated: no real network call is made from the browser in demo mode. */
  async testConnection(
    input: Pick<DataSourceInput, "url" | "type">,
  ): Promise<{ ok: boolean; message: string; simulated: true }> {
    await latency(900);
    if (input.type === "document_upload" || input.type === "csv" || input.type === "excel")
      return {
        ok: true,
        message: "File-based source: validation happens on upload (simulated).",
        simulated: true,
      };
    if (!/^https?:\/\//.test(input.url))
      return { ok: false, message: "URL must start with http:// or https://", simulated: true };
    return {
      ok: true,
      message:
        "Simulated check passed. A compatible backend adapter is still required to collect data.",
      simulated: true,
    };
  },
  async triggerSync(id: string): Promise<SyncLog> {
    await latency(1100);
    const db = mockDb();
    const s = db.sources.find((x) => x.id === id);
    if (!s) throw new Error("Source not found");
    const now = new Date().toISOString();
    const ok = s.status !== "pending" && s.status !== "disabled";
    const log: SyncLog = {
      id: `LOG-${id}-${Date.now()}`,
      sourceId: id,
      startedAt: now,
      durationSec: 3,
      status: ok ? "success" : "partial",
      records: 0,
      message: ok
        ? "Simulated sync completed (demo — no new records)"
        : "No adapter configured for this source — simulated run only",
    };
    db.syncLogs.unshift(log);
    if (ok) {
      s.lastSync = now;
      s.status = "connected";
    }
    return clone(log);
  },
  async getLogs(id: string): Promise<SyncLog[]> {
    await latency(200);
    return clone(
      mockDb()
        .syncLogs.filter((l) => l.sourceId === id)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    );
  },
};

/** Demo-mode persistence uses localStorage per user; the real implementation calls the backend. */
export const mockPreferencesService = {
  async get(userId: string): Promise<DashboardPreferences> {
    await latency(150);
    try {
      const raw = window.localStorage.getItem(`${PREFS_KEY}.${userId}`);
      if (raw)
        return { ...clone(DEFAULT_PREFERENCES), ...(JSON.parse(raw) as DashboardPreferences) };
    } catch {
      /* ignore */
    }
    return clone(DEFAULT_PREFERENCES);
  },
  async save(userId: string, prefs: DashboardPreferences): Promise<DashboardPreferences> {
    await latency(300);
    const saved = { ...prefs, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(`${PREFS_KEY}.${userId}`, JSON.stringify(saved));
    return saved;
  },
  async reset(userId: string): Promise<DashboardPreferences> {
    await latency(200);
    window.localStorage.removeItem(`${PREFS_KEY}.${userId}`);
    return clone(DEFAULT_PREFERENCES);
  },
};

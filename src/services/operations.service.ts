// Actions, Data Sources, Dashboard Preferences and Reports services.
import type {
  ActionInput,
  ActionItem,
  ActionStatus,
  DashboardPreferences,
  DataSource,
  DataSourceInput,
  GeneratedReport,
  ReportRequest,
  SyncLog,
} from "@/types";
import { del, get, patch, post, put, USE_MOCK_API } from "./api/client";
import {
  mockActionService,
  mockPreferencesService,
  mockSourceService,
} from "./mock/operations.mock";
import { mockReportService } from "./mock/reports.mock";

// Actions: GET /districts/{id}/actions, POST /actions, PATCH /actions/{id}, POST /actions/{id}/comments
const httpActions = {
  list: (d: string) => get<ActionItem[]>(`/districts/${d}/actions`),
  create: (input: ActionInput) => post<ActionItem>("/actions", input),
  update: (id: string, body: Partial<ActionInput> & { status?: ActionStatus }) =>
    patch<ActionItem>(`/actions/${id}`, body),
  addComment: (id: string, _author: string, text: string) =>
    post<ActionItem>(`/actions/${id}/comments`, { text }),
};

// Sources (admin): credentials are stored and used only by the backend adapters.
const httpSources = {
  list: () => get<DataSource[]>("/sources"),
  create: (input: DataSourceInput) => post<DataSource>("/sources", input),
  update: (id: string, input: Partial<DataSourceInput>) => put<DataSource>(`/sources/${id}`, input),
  setEnabled: (id: string, enabled: boolean) =>
    patch<DataSource>(`/sources/${id}/status`, { enabled }),
  testConnection: (input: Pick<DataSourceInput, "url" | "type">) =>
    post<{ ok: boolean; message: string; simulated?: boolean }>("/sources/test", input),
  triggerSync: (id: string) => post<SyncLog>(`/sources/${id}/sync`),
  getLogs: (id: string) => get<SyncLog[]>(`/sources/${id}/logs`),
};

// Preferences: GET/PUT/DELETE /users/me/dashboard-preferences (userId resolved server-side from token)
const httpPrefs = {
  get: (_userId: string) => get<DashboardPreferences>("/users/me/dashboard-preferences"),
  save: (_userId: string, prefs: DashboardPreferences) =>
    put<DashboardPreferences>("/users/me/dashboard-preferences", prefs),
  reset: (_userId: string) => del<DashboardPreferences>("/users/me/dashboard-preferences"),
};

// Reports: POST /districts/{id}/reports -> GeneratedReport (PDF/Excel rendered client-side or via backend)
const httpReports = {
  generate: (d: string, r: ReportRequest) => post<GeneratedReport>(`/districts/${d}/reports`, r),
};

export const actionService = USE_MOCK_API ? mockActionService : httpActions;
export const sourceService = USE_MOCK_API ? mockSourceService : httpSources;
export const preferencesService = USE_MOCK_API ? mockPreferencesService : httpPrefs;
export const reportService = USE_MOCK_API ? mockReportService : httpReports;

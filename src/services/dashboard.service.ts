import type { District, NotificationItem, OverviewData, SearchResult } from "@/types";
import { get, USE_MOCK_API } from "./api/client";
import { mockConfigService, mockDashboardService } from "./mock/dashboard.mock";

// GET /districts                              -> District[]
// GET /districts/{id}/overview                -> OverviewData
// GET /districts/{id}/notifications           -> NotificationItem[]
// GET /districts/{id}/search?q=               -> SearchResult[]
const httpConfig = { getDistricts: () => get<District[]>("/districts") };
const httpDashboard = {
  getOverview: (d: string) => get<OverviewData>(`/districts/${d}/overview`),
  getNotifications: (d: string) => get<NotificationItem[]>(`/districts/${d}/notifications`),
  search: (d: string, q: string) => get<SearchResult[]>(`/districts/${d}/search`, { q }),
};

export const configService = USE_MOCK_API ? mockConfigService : httpConfig;

export const dashboardService = USE_MOCK_API ? mockDashboardService : httpDashboard;

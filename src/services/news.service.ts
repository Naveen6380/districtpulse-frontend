import type { AIStructuredSummary, NewsArticle, NewsCluster, NewsInsights } from "@/types";
import { get, USE_MOCK_API } from "./api/client";
import { mockNewsService } from "./mock/intel.mock";

// GET /districts/{id}/news/articles?days=30   -> NewsArticle[]
// GET /districts/{id}/news/clusters           -> NewsCluster[]
// GET /districts/{id}/news/insights           -> NewsInsights
// GET /districts/{id}/news/summaries          -> AIStructuredSummary[]
const http = {
  listArticles: (d: string) => get<NewsArticle[]>(`/districts/${d}/news/articles`, { days: 30 }),
  listClusters: (d: string) => get<NewsCluster[]>(`/districts/${d}/news/clusters`),
  getInsights: (d: string) => get<NewsInsights | null>(`/districts/${d}/news/insights`),
  getSummaries: (d: string) => get<AIStructuredSummary[]>(`/districts/${d}/news/summaries`),
};

export const newsService = USE_MOCK_API ? mockNewsService : http;

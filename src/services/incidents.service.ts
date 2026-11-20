import type { Incident, NewsArticle, VerificationStatus } from "@/types";
import { get, patch, USE_MOCK_API } from "./api/client";
import { mockIncidentService } from "./mock/intel.mock";

// GET   /districts/{id}/incidents               -> Incident[]
// GET   /incidents/{id}                         -> { incident, articles, related }
// PATCH /incidents/{id}/verification            { verification, note }
// PATCH /incidents/{id}/department              { departmentId }
const http = {
  list: (d: string) => get<Incident[]>(`/districts/${d}/incidents`),
  get: (id: string) =>
    get<{ incident: Incident; articles: NewsArticle[]; related: Incident[] }>(
      `/intelligence/incidents/${id}`,
    ),
  setVerification: (id: string, verification: VerificationStatus, note?: string) =>
    patch<Incident>(`/incidents/${id}/verification`, { verification, note }),
  assignDepartment: (id: string, departmentId: string) =>
    patch<Incident>(`/incidents/${id}/department`, { departmentId }),
};

export const incidentService = USE_MOCK_API ? mockIncidentService : http;

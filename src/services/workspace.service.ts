import { api, get, post, del } from "./api/client";

export interface SourceTable {
  columns: string[];
  rows: string[][];
}
export interface ImportedPage {
  url: string;
  title: string;
  text: string;
  tables: SourceTable[];
  links: { title: string; url: string }[];
  publishedAt: string;
  lastModified: string;
  collectedAt: string;
  truncated: boolean;
  contentType: string;
  blockedRequests?: number;
}
export interface ImportRecord {
  id: string;
  district: string;
  sourceUrl: string;
  title: string;
  status: string;
  createdAt: string;
  collectedAt?: string;
  pages?: ImportedPage[];
  issues: string[];
  pageCount?: number;
}
export interface AssistantAnswer {
  answer: string;
  method: string;
  sources: { id: string; title: string; url: string; text: string; quote?: string }[];
  notices: string[];
}
export const workspaceService = {
  assistantSources: (district: string) => get<ImportRecord[]>(`/districts/${district}/assistant/sources`),
  voiceCapabilities: (district: string) =>
    get<{ serverTranscription: boolean }>(`/districts/${district}/voice/capabilities`),
  transcribe: (district: string, audio: Blob, language: string) => {
    const form = new FormData();
    form.append("audio", audio, audio.type.includes("wav") ? "recording.wav" : "recording.webm");
    form.append("language", language);
    return api
      .post<{ transcript: string }>(`/districts/${district}/voice/transcribe`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      })
      .then((r) => r.data);
  },
  list: (district: string) => get<ImportRecord[]>(`/districts/${district}/imports`),
  detail: (district: string, id: string) =>
    get<ImportRecord>(`/districts/${district}/imports/${id}`),
  create: (district: string, url: string, related: boolean, render: boolean) =>
    post<ImportRecord>(`/districts/${district}/imports`, {
      url,
      related,
      render,
      authorised: true,
    }),
  refresh: (district: string, id: string) =>
    post<ImportRecord>(`/districts/${district}/imports/${id}/refresh`),
  remove: (district: string, id: string) => del(`/districts/${district}/imports/${id}`),
  ask: (district: string, question: string, scope: string, importId?: string) =>
    api
      .post<AssistantAnswer>(
        `/districts/${district}/assistant`,
        { question, scope, importId },
        { timeout: 60000 },
      )
      .then((r) => r.data),
};

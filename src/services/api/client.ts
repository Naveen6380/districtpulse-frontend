// Axios client for the Spring Boot REST API.
// Configure with VITE_API_BASE_URL (e.g. https://api.example.gov.in/api/v1).
// When it is not set (or VITE_USE_MOCK_API=true) the app runs on clearly labelled demo services.
import axios, { AxiosError } from "axios";
import { clearSession, getToken } from "../auth/session";
import { resolveApiBaseUrl } from "./base-url";

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env["VITE_API_BASE_URL"] as string | undefined,
);
export const USE_MOCK_API = import.meta.env["VITE_USE_MOCK_API"] === "true";

export const api = axios.create({
  baseURL: API_BASE_URL ?? "",
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  const publicRequest = ["/auth/login", "/auth/forgot-password"].includes(config.url ?? "");
  if (!token && !publicRequest) throw new axios.CanceledError("Session ended");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    const district = window.localStorage.getItem("dp.district");
    if (district && config.url !== "/districts") config.headers["X-District-ID"] = district;
  }
  return config;
});

export class ApiError extends Error {
  status?: number | undefined;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const status = error.response?.status;
    const token = getToken();
    if (status === 401 && token && error.config?.headers.Authorization === `Bearer ${token}`)
      clearSession();
    // Never log request config here: it may contain auth headers.
    return Promise.reject(
      new ApiError(error.response?.data?.message ?? error.message ?? "Request failed", status),
    );
  },
);

/** Unwraps `response.data` so service methods return DTOs directly. */
export const get = <T>(url: string, params?: object) =>
  api.get<T>(url, { params }).then((r) => r.data);
export const post = <T>(url: string, body?: unknown) => api.post<T>(url, body).then((r) => r.data);
export const put = <T>(url: string, body?: unknown) => api.put<T>(url, body).then((r) => r.data);
export const patch = <T>(url: string, body?: unknown) =>
  api.patch<T>(url, body).then((r) => r.data);
export const del = <T>(url: string) => api.delete<T>(url).then((r) => r.data);

import type { AuthSession } from "@/types";
import { post, USE_MOCK_API } from "./api/client";
import { mockAuthService } from "./mock/auth.mock";

// Spring Boot endpoints (expected):
//   POST /auth/login            { email, password } -> AuthSession
//   POST /auth/forgot-password  { email }           -> { message }
//   POST /auth/logout
const http = {
  login: (email: string, password: string) => post<AuthSession>("/auth/login", { email, password }),
  requestPasswordReset: (email: string) =>
    post<{ message: string }>("/auth/forgot-password", { email }),
  logout: () => post<void>("/auth/logout"),
};

export const authService = USE_MOCK_API ? mockAuthService : http;

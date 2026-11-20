// MOCK auth — demo only. No passwords are stored; any password with 8+ characters is accepted
// for the three demo accounts. Real authentication and role checks must happen in the backend.
import type { AuthSession } from "@/types";
import { DEMO_USERS } from "./data/reference";
import { latency } from "./store";

export const mockAuthService = {
  async login(email: string, password: string): Promise<AuthSession> {
    await latency(600);
    const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || password.length < 8) throw new Error("Invalid email or password.");
    return {
      token: `demo-token-${user.id}`,
      user,
      expiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    };
  },
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    await latency(500);
    return {
      message: `If an account exists for ${email}, reset instructions will be sent by the backend.`,
    };
  },
  async logout(): Promise<void> {
    await latency(100);
  },
};

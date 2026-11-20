import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
const state = vi.hoisted(() => ({ role: "administrator", get: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: PropsWithChildren) => <a>{children}</a>,
}));
vi.mock("@/lib/district", () => ({ useDistrict: () => ({ districtId: "pudukkottai" }) }));
vi.mock("@/lib/auth", () => ({
  useSession: () => ({ user: { role: state.role } }),
  canAccess: (role: string, roles: string[]) => roles.includes(role),
}));
vi.mock("@/services/api/client", () => ({ get: state.get, USE_MOCK_API: false }));
import { IncidentEmptyState } from "@/components/modules/incident-empty";
beforeEach(() => {
  state.role = "administrator";
  state.get.mockReset();
});
function show() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <IncidentEmptyState />
    </QueryClientProvider>,
  );
}
describe("Empty incident register", () => {
  it("explains the pipeline counts and daily quota block", async () => {
    state.get.mockResolvedValue({
      collected: 20,
      pending: 19,
      failed: 1,
      processed: 0,
      provider: {
        status: "blocked",
        model: "test",
        reasonCode: "DAILY_QUOTA_EXHAUSTED",
        requestLimit: 20,
        retryAt: "2026-11-17T08:00:00Z",
      },
    });
    show();
    expect(await screen.findByText(/News collected: 20/)).toBeInTheDocument();
    expect(screen.getByText(/daily quota exhausted/)).toBeInTheDocument();
    expect(screen.queryByText("No data for this district")).not.toBeInTheDocument();
  });
  it("does not request district-wide news counts for a departmental officer", () => {
    state.role = "department_officer";
    show();
    expect(screen.getByText("No incidents assigned to your department")).toBeInTheDocument();
    expect(state.get).not.toHaveBeenCalled();
  });
});

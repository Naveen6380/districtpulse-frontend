import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import type { KpiSummary, SourceHealth } from "@/types";

vi.mock("@tanstack/react-router", async (original) => ({
  ...(await original<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: PropsWithChildren) => <a>{children}</a>,
}));
vi.mock("@/lib/district", () => ({
  useDistrict: () => ({ district: { name: "Pudukkottai", isDemo: false } }),
}));
vi.mock("@/lib/auth", () => ({
  useSession: () => ({ user: { role: "administrator" } }),
  canAccess: () => true,
}));
vi.mock("@/lib/queries", () => ({
  useOverview: () => ({
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    data: {
      kpis: { activeIncidents: 0, pendingActions: 2 },
      recentNews: [],
      criticalAlerts: [],
      byCategory: [],
      daily: [],
      byLocation: [],
      summaries: [],
      departments: [],
      sourceHealth: { connected: 1 },
    },
  }),
}));
// Keep the regression focused on page gating; chart rendering is independent of empty-state policy.
vi.mock("@/components/widgets/overview-widgets", () => ({
  KpiGrid: ({ kpis }: { kpis: KpiSummary }) => <div>Pending actions: {kpis.pendingActions}</div>,
  SourceHealthPanel: ({ health }: { health: SourceHealth }) => (
    <div>Connected sources: {health.connected}</div>
  ),
  CategoryDonut: () => null,
  CriticalAlertsList: () => null,
  DepartmentTable: () => null,
  LocationBars: () => null,
  RecentNewsList: () => null,
  SummaryCard: () => null,
  TrendChart: () => null,
}));
import { Route } from "@/routes/_authenticated/overview";

describe("Overview with no extracted incidents", () => {
  it("still displays the dashboard, actions and source health while news extraction is empty", () => {
    const Page = Route.options.component!;
    render(<Page />);
    expect(screen.getByText("Pending actions: 2")).toBeInTheDocument();
    expect(screen.getByText("Connected sources: 1")).toBeInTheDocument();
    expect(screen.queryByText("No data for this district")).not.toBeInTheDocument();
  });
});

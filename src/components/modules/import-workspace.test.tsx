import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImportWorkspace } from "./import-workspace";

const services = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn(), create: vi.fn() }));
vi.mock("@/services/workspace.service", () => ({ workspaceService: services }));
vi.mock("@/lib/district", () => ({
  useDistrict: () => ({ districtId: "pudukkottai", district: { name: "Pudukkottai" } }),
}));
vi.mock("@/lib/auth", () => ({ useSession: () => ({ user: { role: "administrator" } }) }));
vi.mock("@/services/api/client", () => ({
  get: async () => ({ browserRendering: false }),
  post: vi.fn(),
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shows newly processed content without requiring a history click or expanding details", async () => {
  const record = {
    id: "source-1",
    status: "completed",
    title: "Public source",
    issues: [],
    pages: [
      {
        url: "https://publicurl.in/",
        title: "Public source",
        text: "Readable public information",
        publishedAt: "",
        collectedAt: "2026-11-23T00:00:00Z",
        tables: [],
        links: [],
      },
    ],
  };
  services.list.mockResolvedValue([]);
  services.create.mockResolvedValue(record);
  services.detail.mockResolvedValue(record);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ImportWorkspace />
    </QueryClientProvider>,
  );
  fireEvent.change(screen.getByLabelText("Public source URL"), {
    target: { value: "https://publicurl.in/" },
  });
  fireEvent.click(screen.getByLabelText("I am authorised to import this source"));
  fireEvent.click(screen.getByRole("button", { name: "Process URL" }));
  await waitFor(() => expect(screen.getByText("Readable public information")).toBeVisible());
  expect(screen.getByLabelText("Source content").closest("details")).toBeNull();
  expect(screen.queryByText(/Published:|Collected:/)).toBeNull();
  expect(services.create).toHaveBeenCalledWith(
    "pudukkottai",
    "https://publicurl.in/",
    true,
    false,
  );
  client.clear();
});

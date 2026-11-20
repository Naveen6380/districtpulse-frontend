import { ActionsPage } from "@/components/modules/administration";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/actions")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined } =>
    typeof s["q"] === "string" ? { q: s["q"] } : {},
  head: () => ({
    meta: [
      { title: "Action Tracker â€” DistrictPulse AI" },
      { name: "description", content: "Action Tracker for the district administration." },
      { property: "og:title", content: "Action Tracker â€” DistrictPulse AI" },
      { property: "og:description", content: "Action Tracker for the district administration." },
    ],
  }),
  component: Page,
});

function Page() {
  return <ActionsPage />;
}

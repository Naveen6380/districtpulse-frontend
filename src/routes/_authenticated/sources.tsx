import { SourcesPage } from "@/components/modules/administration";
import { createFileRoute } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/sources")({
  beforeLoad: requireRoles(["collector", "administrator"]),
  head: () => ({
    meta: [
      { title: "Data Sources â€” DistrictPulse AI" },
      { name: "description", content: "Data Sources for the district administration." },
      { property: "og:title", content: "Data Sources â€” DistrictPulse AI" },
      { property: "og:description", content: "Data Sources for the district administration." },
    ],
  }),
  component: Page,
});

function Page() {
  return <SourcesPage />;
}

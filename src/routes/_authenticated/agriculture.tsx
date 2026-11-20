import { AgriculturePage } from "@/components/modules/sectors";
import { createFileRoute } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/agriculture")({
  beforeLoad: requireRoles(["collector", "administrator"]),
  head: () => ({
    meta: [
      { title: "Agriculture Intelligence â€” DistrictPulse AI" },
      { name: "description", content: "Agriculture Intelligence for the district administration." },
      { property: "og:title", content: "Agriculture Intelligence â€” DistrictPulse AI" },
      {
        property: "og:description",
        content: "Agriculture Intelligence for the district administration.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return <AgriculturePage />;
}

import { ReportsPage } from "@/components/modules/administration";
import { createFileRoute } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/reports")({
  beforeLoad: requireRoles(["collector", "administrator"]),
  head: () => ({
    meta: [
      { title: "Reports & Briefings â€” DistrictPulse AI" },
      { name: "description", content: "Reports & Briefings for the district administration." },
      { property: "og:title", content: "Reports & Briefings â€” DistrictPulse AI" },
      {
        property: "og:description",
        content: "Reports & Briefings for the district administration.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return <ReportsPage />;
}

import { CustomDashboardPage } from "@/components/modules/administration";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/custom-dashboard")({
  head: () => ({
    meta: [
      { title: "Custom Dashboard â€” DistrictPulse AI" },
      { name: "description", content: "Custom Dashboard for the district administration." },
      { property: "og:title", content: "Custom Dashboard â€” DistrictPulse AI" },
      { property: "og:description", content: "Custom Dashboard for the district administration." },
    ],
  }),
  component: Page,
});

function Page() {
  return <CustomDashboardPage />;
}

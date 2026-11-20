import { DepartmentsPage } from "@/components/modules/administration";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/departments/")({
  head: () => ({
    meta: [
      { title: "Department Monitoring â€” DistrictPulse AI" },
      { name: "description", content: "Department Monitoring for the district administration." },
      { property: "og:title", content: "Department Monitoring â€” DistrictPulse AI" },
      {
        property: "og:description",
        content: "Department Monitoring for the district administration.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return <DepartmentsPage />;
}

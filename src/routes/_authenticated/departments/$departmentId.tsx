import { DepartmentDetail } from "@/components/modules/administration";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/departments/$departmentId")({
  head: () => ({
    meta: [
      { title: "Department Detail â€” DistrictPulse AI" },
      { name: "description", content: "Department Detail for the district administration." },
      { property: "og:title", content: "Department Detail â€” DistrictPulse AI" },
      { property: "og:description", content: "Department Detail for the district administration." },
    ],
  }),
  component: Page,
});

function Page() {
  const { departmentId } = Route.useParams();
  return <DepartmentDetail id={departmentId} />;
}

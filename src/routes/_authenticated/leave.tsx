import { LeavePage } from "@/components/modules/sectors";
import { createFileRoute } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/leave")({
  beforeLoad: requireRoles(["collector", "administrator"]),
  head: () => ({
    meta: [
      { title: "Leave Management â€” DistrictPulse AI" },
      { name: "description", content: "Leave Management for the district administration." },
      { property: "og:title", content: "Leave Management â€” DistrictPulse AI" },
      { property: "og:description", content: "Leave Management for the district administration." },
    ],
  }),
  component: Page,
});

function Page() {
  return <LeavePage />;
}

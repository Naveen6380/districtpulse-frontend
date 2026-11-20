import { MapPage } from "@/components/modules/sectors";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/map")({
  head: () => ({
    meta: [
      { title: "Map Intelligence â€” DistrictPulse AI" },
      { name: "description", content: "Map Intelligence for the district administration." },
      { property: "og:title", content: "Map Intelligence â€” DistrictPulse AI" },
      { property: "og:description", content: "Map Intelligence for the district administration." },
    ],
  }),
  component: Page,
});

function Page() {
  return <MapPage />;
}

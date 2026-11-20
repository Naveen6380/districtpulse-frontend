import { WeatherPage } from "@/components/modules/sectors";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/weather")({
  head: () => ({
    meta: [
      { title: "Weather Intelligence â€” DistrictPulse AI" },
      { name: "description", content: "Weather Intelligence for the district administration." },
      { property: "og:title", content: "Weather Intelligence â€” DistrictPulse AI" },
      {
        property: "og:description",
        content: "Weather Intelligence for the district administration.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return <WeatherPage />;
}

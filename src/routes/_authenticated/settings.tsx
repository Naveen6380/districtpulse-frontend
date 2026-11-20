import { SettingsPage } from "@/components/modules/administration";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dp/primitives";
import { EmptyState } from "@/components/dp/states";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings â€” DistrictPulse AI" },
      { name: "description", content: "Settings for the district administration." },
      { property: "og:title", content: "Settings â€” DistrictPulse AI" },
      { property: "og:description", content: "Settings for the district administration." },
    ],
  }),
  component: Page,
});

function Page() {
  return <SettingsPage />;
}

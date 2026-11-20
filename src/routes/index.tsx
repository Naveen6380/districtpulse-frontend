import { createFileRoute, redirect } from "@tanstack/react-router";

// "/" has no page of its own: signed-in users land on Overview; the app gate sends others to /login.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DistrictPulse AI — Collector's District Intelligence Platform" },
      {
        name: "description",
        content:
          "Unified district intelligence: incidents, news, weather, agriculture and department monitoring.",
      },
      {
        property: "og:title",
        content: "DistrictPulse AI — Collector's District Intelligence Platform",
      },
      {
        property: "og:description",
        content:
          "Unified district intelligence: incidents, news, weather, agriculture and department monitoring.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/overview" });
  },
});

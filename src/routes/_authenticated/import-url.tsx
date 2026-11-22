import { createFileRoute } from "@tanstack/react-router";
import { requireRoles } from "@/lib/auth";
import { ImportWorkspace } from "@/components/modules/import-workspace";
export const Route = createFileRoute("/_authenticated/import-url")({
  beforeLoad: requireRoles(["collector", "administrator"]),
  head: () => ({ meta: [{ title: "Import URL — DistrictPulse AI" }] }),
  component: ImportWorkspace,
});

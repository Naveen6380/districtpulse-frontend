import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "@/services/auth/session";
import { DistrictProvider } from "@/lib/district";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { DistrictAssistant } from "@/components/modules/assistant";

// Session lives in browser storage, so the gated shell renders client-side only.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  pendingComponent: () => (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-6 text-sm"
      role="status"
    >
      Loading district workspace…
    </div>
  ),
  beforeLoad: ({ location }) => {
    if (!getSession()) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: AppLayout,
});

function AppLayout() {
  return (
    <DistrictProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="min-w-0 bg-background">
          <AppHeader />
          <section
            id="district-workspace"
            aria-label="District workspace"
            className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-6 lg:px-8"
          >
            <Outlet />
          </section>
          <DistrictAssistant />
        </SidebarInset>
      </SidebarProvider>
    </DistrictProvider>
  );
}

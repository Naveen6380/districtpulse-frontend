import { Link, useRouterState } from "@tanstack/react-router";
import { FlaskConical, PlugZap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_GROUPS, NAV_ITEMS } from "@/lib/nav";
import { canAccess, useSession } from "@/lib/auth";
import { USE_MOCK_API } from "@/services/api/client";

export function AppSidebar() {
  const session = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = NAV_ITEMS.filter((n) => canAccess(session?.user.role, n.roles));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link to="/overview" className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <img src="/districtpulse-logo.svg" alt="" className="size-8" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-bold tracking-tight text-sidebar-accent-foreground">
              DistrictPulse AI
            </span>
            <span className="block truncate text-[11px] text-sidebar-muted">
              Collector's Intelligence Platform
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="py-2">
        {NAV_GROUPS.map((group) => {
          const groupItems = items.filter((i) => i.group === group);
          if (!groupItems.length) return null;
          return (
            <SidebarGroup key={group} className="py-1">
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
                {group}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {groupItems.map((item) => {
                    const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.title}
                          className="text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-[inset_3px_0_0_var(--sidebar-primary)]"
                        >
                          <Link to={item.to}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
        {USE_MOCK_API ? (
          <div className="rounded-lg bg-sidebar-accent p-2.5 text-[11px] leading-relaxed text-sidebar-foreground">
            <p className="flex items-center gap-1.5 font-semibold text-sidebar-accent-foreground">
              <FlaskConical className="size-3.5 text-sidebar-primary" /> Demo mode
            </p>
            <p className="mt-0.5 text-sidebar-muted">
              Fictional district data. Set the backend API address to use live services.
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-[11px] text-sidebar-muted">
            <PlugZap className="size-3.5 text-sidebar-primary" /> Connected to district API
          </p>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

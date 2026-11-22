import {
  Building2,
  CalendarCheck,
  ClipboardList,
  CloudRain,
  Database,
  Link as LinkIcon,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  Map as MapIcon,
  Newspaper,
  Settings,
  Sprout,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { LinkProps } from "@tanstack/react-router";
import type { Role } from "@/types";

export interface NavItem {
  title: string;
  to: LinkProps["to"] & string;
  icon: LucideIcon;
  roles?: Role[];
  group: "Intelligence" | "Sectors" | "Administration" | "Workspace";
}

const ALL: Role[] = ["collector", "administrator", "department_officer"];
const LEAD: Role[] = ["collector", "administrator"];

export const NAV_ITEMS: NavItem[] = [
  { title: "Overview", to: "/overview", icon: LayoutDashboard, roles: ALL, group: "Intelligence" },
  { title: "News Intelligence", to: "/news", icon: Newspaper, roles: LEAD, group: "Intelligence" },
  { title: "Incidents", to: "/incidents", icon: TriangleAlert, roles: ALL, group: "Intelligence" },
  { title: "Map Intelligence", to: "/map", icon: MapIcon, roles: ALL, group: "Intelligence" },
  { title: "Weather Intelligence", to: "/weather", icon: CloudRain, roles: ALL, group: "Sectors" },
  {
    title: "Agriculture Intelligence",
    to: "/agriculture",
    icon: Sprout,
    roles: LEAD,
    group: "Sectors",
  },
  { title: "Leave Management", to: "/leave", icon: CalendarCheck, roles: LEAD, group: "Sectors" },
  {
    title: "Department Monitoring",
    to: "/departments",
    icon: Building2,
    roles: ALL,
    group: "Administration",
  },
  {
    title: "Action Tracker",
    to: "/actions",
    icon: ClipboardList,
    roles: ALL,
    group: "Administration",
  },
  {
    title: "Reports & Briefings",
    to: "/reports",
    icon: FileText,
    roles: LEAD,
    group: "Administration",
  },
  { title: "Data Sources", to: "/sources", icon: Database, roles: LEAD, group: "Workspace" },
  { title: "Import URL", to: "/import-url", icon: LinkIcon, roles: LEAD, group: "Workspace" },
  {
    title: "Custom Dashboard",
    to: "/custom-dashboard",
    icon: LayoutGrid,
    roles: ALL,
    group: "Workspace",
  },
  { title: "Settings", to: "/settings", icon: Settings, roles: ALL, group: "Workspace" },
];

export const NAV_GROUPS = ["Intelligence", "Sectors", "Administration", "Workspace"] as const;

export function titleForPath(pathname: string) {
  if (pathname.startsWith("/incidents/")) return "Incident Detail";
  if (pathname.startsWith("/departments/")) return "Department Detail";
  return (
    NAV_ITEMS.find((n) => pathname === n.to || pathname.startsWith(`${n.to}/`))?.title ??
    "DistrictPulse AI"
  );
}

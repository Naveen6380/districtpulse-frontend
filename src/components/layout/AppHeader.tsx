import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronsUpDown,
  Building2,
  ClipboardList,
  FileText,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  Settings,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DemoBadge } from "@/components/dp/badges";
import { titleForPath } from "@/lib/nav";
import { logout, useSession } from "@/lib/auth";
import { useDistrict } from "@/lib/district";
import { useGlobalSearch, useNotifications, useSources } from "@/lib/queries";
import { fmtDateTime, ROLE_LABEL } from "@/lib/format";
import { USE_MOCK_API } from "@/services/api/client";
import { cn } from "@/lib/utils";
import type { Priority, SearchResult } from "@/types";

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <div className="hidden min-w-0 lg:block">
        <p className="truncate text-sm font-semibold text-foreground">{titleForPath(pathname)}</p>
      </div>
      <div className="ml-auto flex items-center gap-1.5 md:gap-2">
        <GlobalSearch />
        <DistrictSelector />
        <SyncIndicator />
        <Notifications />
        <ProfileMenu />
      </div>
    </header>
  );
}

export function DistrictSelector() {
  const { districtId, districts, setDistrictId } = useDistrict();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const selected = districts.find((d) => d.id === districtId);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} aria-label="Select district"
          className="h-9 w-[150px] gap-1.5 bg-card text-sm font-normal sm:w-[190px]">
          <MapPin className="size-3.5 shrink-0 text-teal" />
          <span className="flex-1 truncate text-left">{selected?.name ?? "District"}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(320px,calc(100vw-24px))] p-0">
        <Command label="Search district">
          <CommandInput placeholder="Search district / மாவட்டம்…" aria-label="Search district" />
          <CommandList>
            <CommandEmpty>No matching district found.</CommandEmpty>
            <CommandGroup>
        {districts.map((d) => (
          <CommandItem key={d.id} value={d.id}
            keywords={[d.name, d.tamilName ?? "", ...(d.id === "tiruchirappalli" ? ["Trichy", "Tiruchi", "திருச்சி"] : [])]}
            onSelect={() => {
              setDistrictId(d.id);
              setOpen(false);
              if (d.id !== districtId) void qc.invalidateQueries();
            }}>
            <Check className={cn("size-4", d.id === districtId ? "opacity-100" : "opacity-0")} />
            <span className="min-w-0">
              <span className="block">{d.name}{d.isDemo ? " (demo)" : ""}</span>
              {d.tamilName && <span className="block text-xs text-muted-foreground">{d.tamilName}</span>}
            </span>
          </CommandItem>
        ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function SyncIndicator() {
  const { data } = useSources();
  const last = data
    ?.map((s) => s.lastSync)
    .filter(Boolean)
    .sort()
    .at(-1);
  return (
    <div
      className="hidden items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground xl:flex"
      title="Most recent successful data sync"
    >
      <RefreshCw className="size-3.5" />
      <span>
        Synced <span className="font-medium text-foreground">{last ? fmtDateTime(last) : "—"}</span>
      </span>
      {USE_MOCK_API && <DemoBadge label="Demo" className="ml-1" />}
    </div>
  );
}

const RESULT_ICON = {
  incident: TriangleAlert,
  article: FileText,
  action: ClipboardList,
  department: Building2,
} as const;

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  const { data, isFetching } = useGlobalSearch(debounced);

  const go = (r: SearchResult) => {
    setOpen(false);
    setQ("");
    void navigate({ href: r.link });
  };

  return (
    <Popover open={open && q.trim().length > 1} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search incidents, news, actions…"
            className="h-9 w-56 bg-muted/60 pl-8 lg:w-72"
            aria-label="Global search"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-80 p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isFetching && !data ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">Searching…</p>
        ) : !data?.length ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No results for "{q}"
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {data.map((r) => {
              const Icon = RESULT_ICON[r.type];
              return (
                <li key={`${r.type}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => go(r)}
                    className="flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-accent"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {r.title}
                      </span>
                      <span className="block truncate text-xs capitalize text-muted-foreground">
                        {r.type} · {r.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

const DOT: Record<Priority, string> = {
  critical: "bg-sev-critical",
  high: "bg-sev-high",
  medium: "bg-sev-medium",
  low: "bg-sev-low",
};

function Notifications() {
  const { data = [] } = useNotifications();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const unread = data.filter((n) => !n.read && !readIds.has(n.id)).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-sev-critical text-[10px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          <button
            type="button"
            className="text-xs font-medium text-teal hover:underline"
            onClick={() => setReadIds(new Set(data.map((n) => n.id)))}
          >
            Mark all read
          </button>
        </div>
        {data.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            No notifications for this district.
          </p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {data.map((n) => {
              const isUnread = !n.read && !readIds.has(n.id);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setReadIds((s) => new Set(s).add(n.id));
                      void navigate({ href: n.link });
                    }}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left hover:bg-accent",
                      isUnread && "bg-primary-soft/40",
                    )}
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", DOT[n.priority])} />
                    <span className="min-w-0">
                      <span
                        className={cn("block text-sm text-foreground", isUnread && "font-semibold")}
                      >
                        {n.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {n.detail}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {fmtDateTime(n.date)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ProfileMenu() {
  const session = useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = session?.user;
  const initials = (user?.designation ?? "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  const signOut = async () => {
    await qc.cancelQueries();
    try {
      await logout();
    } finally {
      await navigate({ to: "/login", replace: true });
      qc.clear();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-accent"
          aria-label="Account menu"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </span>
          <span className="hidden text-left leading-tight 2xl:block">
            <span className="block text-sm font-semibold text-foreground">{user?.designation}</span>
            <span className="block text-[11px] text-muted-foreground">
              {user ? ROLE_LABEL[user.role] : ""}
            </span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          <p className="mt-1 text-xs text-teal">{user ? ROLE_LABEL[user.role] : ""}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <UserRound /> Profile & settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/custom-dashboard">
            <Settings /> My dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

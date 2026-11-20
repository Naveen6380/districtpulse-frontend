import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapPinOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FilterBar,
  FilterSelect,
  PageHeader,
  SearchInput,
  SectionCard,
} from "@/components/dp/primitives";
import {
  CategoryBadge,
  ConfidenceMeter,
  DemoBadge,
  IncidentStatusBadge,
  PriorityBadge,
  UnresolvedBadge,
  VerificationBadge,
} from "@/components/dp/badges";
import { DataTable, type Column } from "@/components/dp/data-table";
import { QueryView } from "@/components/dp/states";
import { IncidentEmptyState } from "@/components/modules/incident-empty";
import { useDepartments, useIncidents } from "@/lib/queries";
import { useDistrict } from "@/lib/district";
import { categoryOptions } from "@/lib/category";
import {
  fmtDateTime,
  INCIDENT_STATUS_LABEL,
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  VERIFICATION_LABEL,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Incident, IncidentStatus, Priority, VerificationStatus } from "@/types";

interface IncidentSearch {
  q?: string | undefined;
  category?: string | undefined;
  priority?: string | undefined;
  taluk?: string | undefined;
  verification?: string | undefined;
  status?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}
const KEYS = [
  "q",
  "category",
  "priority",
  "taluk",
  "verification",
  "status",
  "from",
  "to",
] as const;
const UNRESOLVED = "__unresolved";

export const Route = createFileRoute("/_authenticated/incidents/")({
  validateSearch: (s: Record<string, unknown>): IncidentSearch => {
    const out: IncidentSearch = {};
    for (const k of KEYS) if (typeof s[k] === "string" && s[k]) out[k] = s[k] as string;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Incidents — DistrictPulse AI" },
      {
        name: "description",
        content:
          "District incident register with severity, verification status and source traceability.",
      },
      { property: "og:title", content: "Incidents — DistrictPulse AI" },
      {
        property: "og:description",
        content:
          "District incident register with severity, verification status and source traceability.",
      },
    ],
  }),
  component: IncidentsPage,
});

/** IST calendar day of an ISO timestamp. */
const istDay = (iso: string) =>
  new Date(new Date(iso).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);

function IncidentsPage() {
  const q = useIncidents();
  const { district } = useDistrict();
  return (
    <div>
      <PageHeader
        eyebrow={
          <>
            <span className="eyebrow">{district ? `${district.name} district` : "District"}</span>
            {district?.isDemo && <DemoBadge />}
          </>
        }
        title="Incidents"
        description="Every incident extracted from news and field reports, with severity, verification status and the number of independent sources."
      />
      <QueryView query={q} empty={<IncidentEmptyState />}>
        {(rows) => <IncidentRegister rows={rows} />}
      </QueryView>
    </div>
  );
}

function IncidentRegister({ rows }: { rows: Incident[] }) {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/incidents/" });
  const { data: depts = [] } = useDepartments();
  const deptShort = (id: string) => depts.find((d) => d.departmentId === id)?.shortName ?? id;

  const set = (patch: Partial<IncidentSearch>) =>
    void navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });
  const sel = (key: keyof IncidentSearch) => (v: string) =>
    set({ [key]: v === "all" ? undefined : v });

  const taluks = useMemo(
    () => [...new Set(rows.filter((r) => r.location.resolved).map((r) => r.location.taluk))].sort(),
    [rows],
  );
  const hasUnresolved = rows.some((r) => !r.location.resolved);

  const filtered = useMemo(() => {
    const term = search.q?.trim().toLowerCase();
    return rows.filter((i) => {
      if (
        term &&
        ![i.id, i.title, i.location.name, i.description].some((s) => s.toLowerCase().includes(term))
      )
        return false;
      if (search.category && i.category !== search.category) return false;
      if (search.priority && i.priority !== search.priority) return false;
      if (search.verification && i.verification !== search.verification) return false;
      if (search.status && i.status !== search.status) return false;
      if (
        search.taluk === UNRESOLVED
          ? i.location.resolved
          : search.taluk && (!i.location.resolved || i.location.taluk !== search.taluk)
      )
        return false;
      const day = istDay(i.reportedDate);
      if (search.from && day < search.from) return false;
      if (search.to && day > search.to) return false;
      return true;
    });
  }, [rows, search]);

  const unresolved = filtered.filter((i) => !i.location.resolved);
  const counts = (["critical", "high", "medium", "low"] as Priority[]).map((p) => ({
    p,
    n: filtered.filter((i) => i.priority === p && i.verification !== "rejected").length,
  }));
  const active = KEYS.some((k) => search[k]);

  const columns: Column<Incident>[] = [
    {
      key: "id",
      header: "ID",
      cell: (i) => (
        <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">{i.id}</span>
      ),
      sortValue: (i) => i.id,
    },
    {
      key: "title",
      header: "Incident",
      cell: (i) => (
        <div
          className={cn(
            "min-w-[240px] max-w-[380px]",
            i.verification === "rejected" && "opacity-55",
          )}
        >
          <Link
            to="/incidents/$incidentId"
            params={{ incidentId: i.id }}
            className="font-medium text-foreground hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {i.title}
          </Link>
          <div className="mt-1">
            <CategoryBadge category={i.category} />
          </div>
        </div>
      ),
      sortValue: (i) => i.title,
    },
    {
      key: "location",
      header: "Location",
      cell: (i) =>
        i.location.resolved ? (
          <div className="text-sm">
            <p>{i.location.name}</p>
            <p className="text-xs text-muted-foreground">{i.location.taluk} taluk</p>
          </div>
        ) : (
          <div className="space-y-1">
            <UnresolvedBadge />
            <p
              className="max-w-[180px] truncate text-xs text-muted-foreground"
              title={i.location.name}
            >
              As reported: {i.location.name}
            </p>
          </div>
        ),
      sortValue: (i) => (i.location.resolved ? i.location.taluk : "zzz"),
    },
    {
      key: "date",
      header: "Reported",
      cell: (i) => <span className="whitespace-nowrap text-xs">{fmtDateTime(i.reportedDate)}</span>,
      sortValue: (i) => i.reportedDate,
    },
    {
      key: "priority",
      header: "Priority",
      cell: (i) => <PriorityBadge priority={i.priority} />,
      sortValue: (i) => 3 - PRIORITY_ORDER[i.priority],
    },
    {
      key: "status",
      header: "Status",
      cell: (i) => <IncidentStatusBadge status={i.status} />,
      sortValue: (i) => i.status,
    },
    {
      key: "verification",
      header: "Verification",
      cell: (i) => <VerificationBadge status={i.verification} />,
      sortValue: (i) => i.verification,
    },
    {
      key: "confidence",
      header: "AI confidence",
      cell: (i) => <ConfidenceMeter value={i.confidence} />,
      sortValue: (i) => i.confidence,
    },
    {
      key: "sources",
      header: "Sources",
      cell: (i) => <span className="tabular">{i.sourceCount}</span>,
      sortValue: (i) => i.sourceCount,
      className: "text-center",
    },
    {
      key: "dept",
      header: "Department",
      cell: (i) => <span className="text-xs">{deptShort(i.departmentId)}</span>,
      sortValue: (i) => deptShort(i.departmentId),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {counts.map(({ p, n }) => (
          <button
            key={p}
            type="button"
            onClick={() => set({ priority: search.priority === p ? undefined : p })}
            className={cn(
              "surface-card flex items-center justify-between p-3 text-left transition-shadow hover:shadow-raised",
              search.priority === p && "ring-2 ring-ring",
            )}
            aria-pressed={search.priority === p}
          >
            <PriorityBadge priority={p} />
            <span className="tabular text-2xl font-bold">{n}</span>
          </button>
        ))}
      </div>

      <SectionCard
        title={`Incident register · ${filtered.length} of ${rows.length}`}
        description="Rejected incidents stay visible but muted for audit. Click a row for sources and history."
        actions={
          active ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void navigate({ search: {}, replace: true })}
            >
              <X className="size-3.5" /> Clear filters
            </Button>
          ) : undefined
        }
      >
        <FilterBar>
          <SearchInput
            value={search.q ?? ""}
            onChange={(v) => set({ q: v || undefined })}
            placeholder="Search ID, title, place…"
            className="sm:w-64"
          />
          <FilterSelect
            label="Category"
            value={search.category ?? "all"}
            onChange={sel("category")}
            allLabel="All categories"
            options={categoryOptions(rows)}
          />
          <FilterSelect
            label="Priority"
            value={search.priority ?? "all"}
            onChange={sel("priority")}
            allLabel="All priorities"
            options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => ({
              value: p,
              label: PRIORITY_LABEL[p],
            }))}
          />
          <FilterSelect
            label="Taluk"
            value={search.taluk ?? "all"}
            onChange={sel("taluk")}
            allLabel="All taluks"
            options={[
              ...taluks.map((t) => ({ value: t, label: t })),
              ...(hasUnresolved ? [{ value: UNRESOLVED, label: "Unresolved location" }] : []),
            ]}
          />
          <FilterSelect
            label="Verification"
            value={search.verification ?? "all"}
            onChange={sel("verification")}
            allLabel="Any verification"
            options={(Object.keys(VERIFICATION_LABEL) as VerificationStatus[]).map((v) => ({
              value: v,
              label: VERIFICATION_LABEL[v],
            }))}
          />
          <FilterSelect
            label="Status"
            value={search.status ?? "all"}
            onChange={sel("status")}
            allLabel="Any status"
            options={(Object.keys(INCIDENT_STATUS_LABEL) as IncidentStatus[]).map((v) => ({
              value: v,
              label: INCIDENT_STATUS_LABEL[v],
            }))}
          />
          <div className="flex items-center gap-1.5">
            <Label htmlFor="inc-from" className="text-xs text-muted-foreground">
              From
            </Label>
            <Input
              id="inc-from"
              type="date"
              className="h-9 w-[140px] bg-card"
              value={search.from ?? ""}
              onChange={(e) => set({ from: e.target.value || undefined })}
            />
            <Label htmlFor="inc-to" className="text-xs text-muted-foreground">
              To
            </Label>
            <Input
              id="inc-to"
              type="date"
              className="h-9 w-[140px] bg-card"
              value={search.to ?? ""}
              onChange={(e) => set({ to: e.target.value || undefined })}
            />
          </div>
        </FilterBar>
        <DataTable
          rows={filtered}
          columns={columns}
          rowKey={(i) => i.id}
          pageSize={12}
          initialSort={{ key: "date", dir: "desc" }}
          onRowClick={(i) =>
            void navigate({ to: "/incidents/$incidentId", params: { incidentId: i.id } })
          }
        />
      </SectionCard>

      {unresolved.length > 0 && (
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <MapPinOff className="size-4 text-warning" /> Unresolved locations ·{" "}
              {unresolved.length}
            </span>
          }
          description="The source text did not identify a place precisely enough. These are not mapped or assigned to a taluk until an officer confirms the location."
        >
          <ul className="divide-y">
            {unresolved.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
                <Link
                  to="/incidents/$incidentId"
                  params={{ incidentId: i.id }}
                  className="font-medium hover:underline"
                >
                  {i.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  As reported: “{i.location.name}”
                </span>
                <span className="ml-auto flex items-center gap-1.5">
                  <CategoryBadge category={i.category} />
                  <PriorityBadge priority={i.priority} />
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

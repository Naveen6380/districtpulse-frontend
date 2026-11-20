import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ArrowUp, ArrowDown, Download, RefreshCw } from "lucide-react";
import { PageHeader, SectionCard, FilterBar, SearchInput } from "@/components/dp/primitives";
import { QueryView, EmptyState } from "@/components/dp/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PriorityBadge, SourceStatusBadge } from "@/components/dp/badges";
import { CreateActionDialog } from "@/components/actions/CreateActionDialog";
import {
  useActions,
  useAddComment,
  useUpdateAction,
  useDepartments,
  useDepartment,
  useSources,
  useSaveSource,
  useToggleSource,
  useTriggerSync,
  useSyncLogs,
  usePreferences,
  useSavePreferences,
  useResetPreferences,
  useOverview,
} from "@/lib/queries";
import { useDistrict } from "@/lib/district";
import { useSession } from "@/lib/auth";
import { reportService, sourceService } from "@/services/operations.service";
import { get, post, USE_MOCK_API } from "@/services/api/client";
import { fmtDate, fmtDateTime } from "@/lib/format";
import {
  KpiGrid,
  CriticalAlertsList,
  TrendChart,
  RecentNewsList,
  SourceHealthPanel,
  DepartmentTable,
} from "@/components/widgets/overview-widgets";
import type {
  ActionItem,
  ActionStatus,
  DashboardPreferences,
  DataSource,
  DataSourceInput,
  GeneratedReport,
  ReportType,
  WidgetId,
} from "@/types";

const inputClass = "h-9 rounded-md border bg-card px-3 text-sm";
const statuses: ActionStatus[] = ["open", "in_progress", "under_review", "completed", "on_hold"];

export function ActionsPage() {
  const query = useActions(),
    update = useUpdateAction(),
    add = useAddComment();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [selected, setSelected] = useState<ActionItem | null>(null);
  const [comment, setComment] = useState("");
  const [kanban, setKanban] = useState(false);
  const card = (a: ActionItem) => (
    <div key={a.id} className="rounded-lg border bg-card p-4">
      <button
        className="text-left text-sm font-semibold hover:underline"
        onClick={() => setSelected(a)}
      >
        {a.title}
      </button>
      <div className="my-2">
        <PriorityBadge priority={a.priority} />
      </div>
      <p className="text-xs text-muted-foreground">
        {a.departmentId} · Due {fmtDate(a.dueDate)}{" "}
        {a.status !== "completed" && a.dueDate < new Date().toISOString().slice(0, 10)
          ? "· Overdue"
          : ""}
      </p>
      <select
        aria-label={`Status for ${a.title}`}
        className={`${inputClass} mt-3 w-full`}
        value={a.status}
        disabled={update.isPending}
        onChange={(e) =>
          update.mutate({ id: a.id, patch: { status: e.target.value as ActionStatus } })
        }
      >
        {statuses.map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </div>
  );
  return (
    <>
      <PageHeader
        title="Action Tracker"
        description="Departmental follow-up, due dates and accountable progress."
        actions={
          <CreateActionDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                New action
              </Button>
            }
          />
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} />
        <select
          aria-label="Action status"
          className={inputClass}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select
          aria-label="Action priority"
          className={inputClass}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <Button variant="outline" onClick={() => setKanban(!kanban)}>
          {kanban ? "List view" : "Kanban view"}
        </Button>
      </FilterBar>
      <QueryView query={query}>
        {(rows) => {
          const filtered = rows.filter(
            (a) =>
              a.title.toLowerCase().includes(search.toLowerCase()) &&
              (status === "all" || a.status === status) &&
              (priority === "all" || a.priority === priority),
          );
          return kanban ? (
            <div className="grid gap-4 overflow-x-auto lg:grid-cols-5">
              {statuses.map((s) => (
                <SectionCard key={s} title={s.replaceAll("_", " ")}>
                  <div className="space-y-3">
                    {filtered.filter((a) => a.status === s).map(card)}
                  </div>
                </SectionCard>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map(card)}
              {!filtered.length && <EmptyState title="No matching actions" />}
            </div>
          );
        }}
      </QueryView>
      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>{selected?.description}</DialogDescription>
          </DialogHeader>
          {(query.data?.find((a) => a.id === selected?.id)?.comments ?? []).map((c) => (
            <div key={c.id} className="rounded border p-3 text-sm">
              <strong>{c.author}</strong>
              <p>{c.text}</p>
              <small>{fmtDateTime(c.date)}</small>
            </div>
          ))}
          <Textarea
            aria-label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button
            disabled={!comment.trim() || add.isPending}
            onClick={() => {
              if (selected)
                add.mutate({ id: selected.id, text: comment }, { onSuccess: () => setComment("") });
            }}
          >
            Add comment
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DepartmentsPage() {
  const query = useDepartments();
  return (
    <>
      <PageHeader title="Department Monitoring" />
      <QueryView query={query}>
        {(rows) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((d) => (
              <SectionCard
                key={d.departmentId}
                title={
                  <Link
                    to="/departments/$departmentId"
                    params={{ departmentId: d.departmentId }}
                    className="hover:underline"
                  >
                    {d.department}
                  </Link>
                }
              >
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    Active incidents<strong className="block text-2xl">{d.activeIncidents}</strong>
                  </div>
                  <div>
                    Pending actions<strong className="block text-2xl">{d.pendingActions}</strong>
                  </div>
                  <div>
                    Completed<strong className="block">{d.completedActions}</strong>
                  </div>
                  <div>
                    Critical<strong className="block text-destructive">{d.critical}</strong>
                  </div>
                </dl>
              </SectionCard>
            ))}
          </div>
        )}
      </QueryView>
    </>
  );
}
export function DepartmentDetail({ id }: { id: string }) {
  const q = useDepartment(id);
  return (
    <QueryView query={q}>
      {(d) => (
        <>
          <PageHeader title={d.department.name} description={d.department.headDesignation} />
          <SectionCard title="Incidents">
            <ul className="divide-y">
              {d.incidents.map((i) => (
                <li className="py-3" key={i.id}>
                  <Link
                    className="text-sm hover:underline"
                    to="/incidents/$incidentId"
                    params={{ incidentId: i.id }}
                  >
                    {i.title}
                  </Link>
                  <PriorityBadge priority={i.priority} />
                </li>
              ))}
            </ul>
            {!d.incidents.length && <EmptyState title="No incidents" />}
          </SectionCard>
          <SectionCard title="Actions" className="mt-4">
            {d.actions.map((a) => (
              <p key={a.id} className="py-2 text-sm">
                {a.title} · {a.status} · {fmtDate(a.dueDate)}
              </p>
            ))}
          </SectionCard>
        </>
      )}
    </QueryView>
  );
}

const blank: DataSourceInput = {
  name: "",
  url: "",
  description: "",
  category: "news",
  type: "xml",
  coverage: "Pudukkottai district",
  accessMethod: "Public RSS feed",
  authRequired: false,
  frequency: "On demand",
};
export function SourcesPage() {
  const q = useSources(),
    save = useSaveSource(),
    toggle = useToggleSource(),
    sync = useTriggerSync();
  const [form, setForm] = useState<DataSourceInput | null>(null);
  const [editing, setEditing] = useState<string>();
  const [logs, setLogs] = useState<string | null>(null);
  const logQuery = useSyncLogs(logs);
  const [search, setSearch] = useState("");
  const [testing, setTesting] = useState(false);
  const field = (key: keyof DataSourceInput, value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));
  return (
    <>
      <PageHeader
        title="Data Sources"
        description="Source provenance, collection status and actual sync results."
        actions={
          <Button
            onClick={() => {
              setEditing(undefined);
              setForm({ ...blank });
            }}
          >
            <Plus className="size-4" />
            Add source
          </Button>
        }
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} />
      </FilterBar>
      <QueryView query={q}>
        {(rows) => (
          <div className="space-y-3">
            {rows
              .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
              .map((s) => (
                <SectionCard
                  key={s.id}
                  title={s.name}
                  description={`${s.coverage} · ${s.type} · ${s.frequency}`}
                  actions={<SourceStatusBadge status={s.status} />}
                >
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-sm text-primary underline"
                  >
                    {s.url}
                  </a>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last sync: {s.lastSync ? fmtDateTime(s.lastSync) : "Never"} · Records:{" "}
                    {s.recordsCollected}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(s.id);
                        setForm({ ...s });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={toggle.isPending}
                      onClick={() => toggle.mutate({ id: s.id, enabled: s.status === "disabled" })}
                    >
                      {s.status === "disabled" ? "Enable" : "Disable"}
                    </Button>
                    <Button
                      size="sm"
                      disabled={sync.isPending || s.status === "disabled"}
                      onClick={() => sync.mutate(s.id)}
                    >
                      <RefreshCw className="size-3" />
                      Sync
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setLogs(s.id)}>
                      Logs
                    </Button>
                  </div>
                </SectionCard>
              ))}
          </div>
        )}
      </QueryView>
      <Dialog
        open={!!form}
        onOpenChange={(v) => {
          if (!v) setForm(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit source" : "Add source"}</DialogTitle>
            <DialogDescription>
              RSS/Atom is supported automatically. Other sources require an authorised adapter or
              import.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(
                  { ...(editing ? { id: editing } : {}), input: form },
                  { onSuccess: () => setForm(null) },
                );
              }}
            >
              {(
                ["name", "url", "description", "coverage", "accessMethod", "frequency"] as const
              ).map((k) => (
                <div key={k}>
                  <Label htmlFor={`source-${k}`}>{k}</Label>
                  <Input
                    id={`source-${k}`}
                    required={k === "name" || k === "url"}
                    type={k === "url" ? "url" : "text"}
                    maxLength={k === "url" ? 2000 : 500}
                    value={form[k]}
                    onChange={(e) => field(k, e.target.value)}
                  />
                </div>
              ))}
              <Label>
                Category
                <select
                  aria-label="Source category"
                  className={`${inputClass} ml-2`}
                  value={form.category}
                  onChange={(e) => field("category", e.target.value)}
                >
                  {["news", "government", "farmwise", "weather", "agriculture", "custom"].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </Label>
              <Label>
                Type
                <select
                  aria-label="Source type"
                  className={`${inputClass} ml-2`}
                  value={form.type}
                  onChange={(e) => field("type", e.target.value)}
                >
                  {[
                    "xml",
                    "rest_api",
                    "public_webpage",
                    "json",
                    "csv",
                    "excel",
                    "document_upload",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={testing}
                  onClick={async () => {
                    setTesting(true);
                    try {
                      const r = await sourceService.testConnection(form);
                      toast[r.ok ? "success" : "warning"](r.message);
                    } catch (e) {
                      toast.error((e as Error).message);
                    } finally {
                      setTesting(false);
                    }
                  }}
                >
                  Test connection
                </Button>
                <Button disabled={save.isPending}>Save source</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!logs}
        onOpenChange={(v) => {
          if (!v) setLogs(null);
        }}
      >
        <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Synchronization logs</DialogTitle>
            <DialogDescription>Actual collection outcomes</DialogDescription>
          </DialogHeader>
          <QueryView query={logQuery}>
            {(rows) => (
              <ul className="divide-y">
                {rows.map((l) => (
                  <li key={l.id} className="py-3 text-sm">
                    <strong>
                      {l.status} · {fmtDateTime(l.startedAt)}
                    </strong>
                    <p>{l.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReportsPage() {
  const { districtId } = useDistrict();
  const [type, setType] = useState<ReportType>("daily");
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(today),
    [to, setTo] = useState(today);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const generate = useMutation({
    mutationFn: () =>
      reportService.generate(districtId, {
        type,
        from,
        to,
        categories: [],
        departmentIds: [],
        priorities: [],
      }),
    onSuccess: setReport,
    onError: (e: Error) => toast.error(e.message),
  });
  const pdf = async () => {
    if (!report) return;
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    let y = 18;
    doc.setFontSize(15);
    doc.text(report.title, 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`${report.district} | ${report.period}`, 14, y);
    y += 10;
    for (const s of report.sections) {
      if (y > 260) {
        doc.addPage();
        y = 18;
      }
      doc.text(s.heading, 14, y);
      y += 7;
      for (const p of s.paragraphs ?? []) {
        const lines = doc.splitTextToSize(p, 180);
        if (y + lines.length * 5 > 280) {
          doc.addPage();
          y = 18;
        }
        doc.text(lines, 14, y);
        y += lines.length * 5 + 4;
      }
      if (s.table) {
        autoTable(doc, {
          startY: y,
          head: [s.table.columns],
          body: s.table.rows,
          styles: { fontSize: 8 },
        });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }
    }
    doc.save("district-intelligence.pdf");
  };
  const excel = async () => {
    if (!report) return;
    const XLSX = await import("xlsx");
    const book = XLSX.utils.book_new();
    report.sections.forEach((s, n) => {
      const data = [
        [s.heading],
        [s.kind],
        ...(s.paragraphs ?? []).map((p) => [p]),
        ...(s.table ? [s.table.columns, ...s.table.rows] : []),
      ];
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(data), `Section ${n + 1}`);
    });
    XLSX.writeFile(book, "district-intelligence.xlsx");
  };
  return (
    <>
      <PageHeader title="Reports & Briefings" />
      <FilterBar>
        <select
          aria-label="Report type"
          className={inputClass}
          value={type}
          onChange={(e) => setType(e.target.value as ReportType)}
        >
          {[
            "daily",
            "weekly",
            "monthly",
            "critical",
            "department",
            "news_trend",
            "weather",
            "agriculture",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <Input
          className="w-auto"
          aria-label="From date"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          className="w-auto"
          aria-label="To date"
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <Button
          disabled={generate.isPending || !from || !to || from > to}
          onClick={() => generate.mutate()}
        >
          Generate report
        </Button>
      </FilterBar>
      {report ? (
        <>
          <div className="mb-4 flex gap-2">
            <Button variant="outline" onClick={() => void pdf()}>
              <Download className="size-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => void excel()}>
              Excel
            </Button>
          </div>
          <SectionCard title={report.title} description={`${report.district} · ${report.period}`}>
            <div className="space-y-6">
              {report.sections.map((s, n) => (
                <section key={n}>
                  <h3 className="text-sm font-semibold">
                    {s.heading} <span className="text-xs text-muted-foreground">({s.kind})</span>
                  </h3>
                  {s.paragraphs?.map((p) => (
                    <p key={p} className="mt-2 text-sm text-muted-foreground">
                      {p}
                    </p>
                  ))}
                  {s.table && (
                    <div className="mt-3 overflow-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr>
                            {s.table.columns.map((c) => (
                              <th className="border-b p-2" key={c}>
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.table.rows.map((r, i) => (
                            <tr key={i}>
                              {r.map((c, j) => (
                                <td className="border-b p-2" key={j}>
                                  {c}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}
            </div>
          </SectionCard>
        </>
      ) : (
        <EmptyState
          title="Generate a district briefing"
          description="Choose dates and report type. Reports preserve review status and evidence references."
        />
      )}
    </>
  );
}

const widgetLabels: Record<WidgetId, string> = {
  incident_overview: "Incident overview",
  critical_alerts: "Critical alerts",
  news_intelligence: "News intelligence",
  weather_summary: "Weather summary",
  agriculture_summary: "Agriculture summary",
  department_performance: "Department performance",
  action_tracker: "Action tracker",
  incident_map: "Incident map",
  trend_analysis: "Trend analysis",
  source_health: "Source health",
};
export function CustomDashboardPage() {
  const q = usePreferences(),
    overview = useOverview(),
    save = useSavePreferences(),
    reset = useResetPreferences();
  const [draft, setDraft] = useState<DashboardPreferences>();
  const [drag, setDrag] = useState<WidgetId | null>(null);
  useEffect(() => {
    if (q.data) setDraft(q.data);
  }, [q.data]);
  const move = (index: number, delta: number) => {
    if (!draft) return;
    const items = [...draft.widgets];
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target]!, items[index]!];
    setDraft({ ...draft, widgets: items });
  };
  return (
    <>
      <PageHeader
        title="Custom Dashboard"
        description="Choose and arrange your widgets. Preferences are stored for your account."
        actions={
          <>
            <Button variant="outline" disabled={reset.isPending} onClick={() => reset.mutate()}>
              Reset
            </Button>
            <Button disabled={!draft || save.isPending} onClick={() => draft && save.mutate(draft)}>
              Save layout
            </Button>
          </>
        }
      />
      <QueryView query={q}>
        {() =>
          draft && (
            <>
              <SectionCard title="Widgets">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {(Object.keys(widgetLabels) as WidgetId[]).map((id) => (
                    <Label key={id} className="flex items-center gap-2">
                      <Checkbox
                        checked={draft.widgets.includes(id)}
                        onCheckedChange={(v) =>
                          setDraft({
                            ...draft,
                            widgets: v
                              ? [...draft.widgets, id]
                              : draft.widgets.filter((w) => w !== id),
                          })
                        }
                      />
                      {widgetLabels[id]}
                    </Label>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Label>
                    Locations (comma separated)
                    <Input
                      value={draft.locations.join(", ")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          locations: e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </Label>
                  <Label>
                    Categories (comma separated)
                    <Input
                      value={draft.categories.join(", ")}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          categories: e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean) as DashboardPreferences["categories"],
                        })
                      }
                    />
                  </Label>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  {(["critical", "high", "weather", "overdueActions"] as const).map((k) => (
                    <Label className="flex gap-2" key={k}>
                      <Checkbox
                        checked={draft.alerts[k]}
                        onCheckedChange={(v) =>
                          setDraft({ ...draft, alerts: { ...draft.alerts, [k]: !!v } })
                        }
                      />
                      {k}
                    </Label>
                  ))}
                </div>
              </SectionCard>
              <QueryView query={overview}>
                {(o) => (
                  <div className="mt-4 space-y-4">
                    {draft.widgets.map((id, n) => (
                      <div
                        key={id}
                        draggable
                        onDragStart={() => setDrag(id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (drag) {
                            const next = draft.widgets.filter((w) => w !== drag);
                            next.splice(n, 0, drag);
                            setDraft({ ...draft, widgets: next });
                            setDrag(null);
                          }
                        }}
                      >
                        <SectionCard
                          title={widgetLabels[id]}
                          actions={
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Move widget up"
                                onClick={() => move(n, -1)}
                              >
                                <ArrowUp className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label="Move widget down"
                                onClick={() => move(n, 1)}
                              >
                                <ArrowDown className="size-4" />
                              </Button>
                            </>
                          }
                        >
                          {id === "incident_overview" ? (
                            <KpiGrid kpis={o.kpis} />
                          ) : id === "critical_alerts" ? (
                            <CriticalAlertsList
                              incidents={o.criticalAlerts.filter(
                                (i) =>
                                  (!draft.categories.length ||
                                    draft.categories.includes(i.category)) &&
                                  (!draft.locations.length ||
                                    draft.locations.includes(i.location.name) ||
                                    draft.locations.includes(i.location.taluk)),
                              )}
                            />
                          ) : id === "news_intelligence" ? (
                            <RecentNewsList articles={o.recentNews} />
                          ) : id === "trend_analysis" ? (
                            <TrendChart data={o.daily} />
                          ) : id === "source_health" ? (
                            <SourceHealthPanel health={o.sourceHealth} />
                          ) : id === "department_performance" ? (
                            <DepartmentTable rows={o.departments} />
                          ) : (
                            <Link
                              to={
                                id === "weather_summary"
                                  ? "/weather"
                                  : id === "agriculture_summary"
                                    ? "/agriculture"
                                    : id === "incident_map"
                                      ? "/map"
                                      : "/actions"
                              }
                              className="text-sm text-primary underline"
                            >
                              Open {widgetLabels[id]}
                            </Link>
                          )}
                        </SectionCard>
                      </div>
                    ))}
                  </div>
                )}
              </QueryView>
            </>
          )
        }
      </QueryView>
    </>
  );
}

export function SettingsPage() {
  const session = useSession();
  const [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState("collector"),
    [departmentId, setDepartment] = useState("pwd");
  const depts = useDepartments();
  const create = useMutation({
    mutationFn: () => post("/auth/users", { email, name, password, role, departmentId }),
    onSuccess: () => {
      toast.success("User created");
      setPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <>
      <PageHeader title="Settings" />
      <SectionCard title="Account">
        <p className="text-sm">
          {session?.user.name} · {session?.user.email} · {session?.user.role}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Authentication and permissions are enforced by the backend. Ask your administrator for
          password resets.
        </p>
      </SectionCard>
      {session?.user.role === "administrator" && (
        <SectionCard className="mt-4" title="Create authorised user">
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <Input
              aria-label="User name"
              placeholder="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              aria-label="User email"
              placeholder="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              aria-label="Temporary password"
              placeholder="Temporary password (12+ characters)"
              type="password"
              minLength={12}
              maxLength={72}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <select
              aria-label="User role"
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {["collector", "administrator", "department_officer"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {role === "department_officer" && (
              <select
                aria-label="User department"
                className={inputClass}
                value={departmentId}
                onChange={(e) => setDepartment(e.target.value)}
              >
                {depts.data?.map((d) => (
                  <option key={d.departmentId} value={d.departmentId}>
                    {d.department}
                  </option>
                ))}
              </select>
            )}
            <Button disabled={create.isPending}>Create user</Button>
          </form>
        </SectionCard>
      )}
    </>
  );
}

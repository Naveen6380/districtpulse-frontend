// Overview widgets. Pure presentational: they receive DTOs from the service layer.
// Re-used by the Overview page and the Custom Dashboard.
import { Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertOctagon,
  ChevronRight,
  ClipboardList,
  CloudRain,
  ExternalLink,
  Flame,
  Newspaper,
} from "lucide-react";
import type {
  AIStructuredSummary,
  DepartmentStats,
  Incident,
  KpiSummary,
  NewsArticle,
  SourceHealth,
} from "@/types";
import {
  AIBadge,
  CategoryBadge,
  ConfidenceMeter,
  PriorityBadge,
  SourceStatusBadge,
  UnresolvedBadge,
  VerificationBadge,
} from "@/components/dp/badges";
import { KpiCard } from "@/components/dp/primitives";
import { AXIS, ChartTooltip, GRID, Legend } from "@/components/dp/chart";
import { EmptyState } from "@/components/dp/states";
import { fmtDate, fmtDateTime, fmtNum, fmtShortDay } from "@/lib/format";
import { categoryColor, categoryLabel } from "@/lib/category";

export function KpiGrid({ kpis }: { kpis: KpiSummary }) {
  const delta = kpis.incidentsLast7 - kpis.incidentsPrev7;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        label="Active incidents"
        value={fmtNum(kpis.activeIncidents)}
        icon={Activity}
        to="/incidents"
        delta={{ value: delta, label: "new vs previous 7 days", goodWhenDown: true }}
      />
      <KpiCard
        label="Critical"
        value={fmtNum(kpis.criticalIncidents)}
        icon={AlertOctagon}
        tone="critical"
        to="/incidents"
        hint="Needs immediate attention"
      />
      <KpiCard
        label="High priority"
        value={fmtNum(kpis.highPriority)}
        icon={Flame}
        tone="high"
        to="/incidents"
        hint="Active, high severity"
      />
      <KpiCard
        label="Weather alerts"
        value={kpis.weatherAlertsAvailable === false ? "—" : fmtNum(kpis.weatherAlerts)}
        icon={CloudRain}
        tone="teal"
        to="/weather"
        hint={kpis.weatherAlertsAvailable === false ? "Source not connected" : "Active warnings"}
      />
      <KpiCard
        label="Pending actions"
        value={fmtNum(kpis.pendingActions)}
        icon={ClipboardList}
        tone="warning"
        to="/actions"
        hint="Not yet completed"
      />
      <KpiCard
        label="News analysed"
        value={fmtNum(kpis.newsAnalyzed)}
        icon={Newspaper}
        tone="success"
        to="/news"
        hint="Last 30 days"
      />
    </div>
  );
}

export function CriticalAlertsList({ incidents }: { incidents: Incident[] }) {
  if (!incidents.length)
    return (
      <EmptyState
        title="No critical or high alerts"
        description="All active incidents are medium or low priority."
      />
    );
  return (
    <ul className="-my-1 divide-y">
      {incidents.map((i) => (
        <li key={i.id}>
          <Link
            to="/incidents/$incidentId"
            params={{ incidentId: i.id }}
            className="group flex items-start gap-3 py-3 hover:bg-accent/40"
          >
            <span
              className={`mt-1 h-10 w-1 shrink-0 rounded-full ${i.priority === "critical" ? "bg-sev-critical" : "bg-sev-high"}`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <PriorityBadge priority={i.priority} />
                <CategoryBadge category={i.category} />
                <VerificationBadge status={i.verification} />
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground group-hover:underline">
                {i.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {i.location.name} · {fmtDateTime(i.reportedDate)} · {i.sourceCount} source
                {i.sourceCount === 1 ? "" : "s"}
              </p>
            </div>
            <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CategoryDonut({ data }: { data: { category: string; count: number }[] }) {
  const rows = data.filter((d) => d.count > 0);
  const total = rows.reduce((s, d) => s + d.count, 0);
  if (!total) return <EmptyState title="No incidents yet" />;
  return (
    <div>
      <div className="relative h-48">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="category"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {rows.map((r) => (
                <Cell
                  key={r.category}
                  fill={categoryColor(r.category)}
                  name={categoryLabel(r.category)}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-2xl font-bold">{total}</span>
          <span className="text-[11px] text-muted-foreground">incidents</span>
        </div>
      </div>
      <div className="mt-3">
        <Legend
          items={rows.map((r) => ({
            label: categoryLabel(r.category),
            color: categoryColor(r.category),
            value: r.count,
          }))}
        />
      </div>
    </div>
  );
}

export function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="date" {...AXIS} tickFormatter={fmtShortDay} interval={4} />
          <YAxis {...AXIS} allowDecimals={false} />
          <Tooltip content={<ChartTooltip formatLabel={fmtShortDay} />} />
          <Area
            type="monotone"
            dataKey="count"
            name="Incidents"
            stroke="var(--chart-2)"
            strokeWidth={2}
            fill="url(#trendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WeeklyBars({ data }: { data: { week: string; count: number }[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="week" {...AXIS} />
          <YAxis {...AXIS} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="count" name="Incidents" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LocationBars({ data }: { data: { location: string; count: number }[] }) {
  if (!data.length) return <EmptyState title="No locations yet" />;
  const max = Math.max(...data.map((d) => d.count));
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.location}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span
              className={
                d.location === "Unresolved"
                  ? "font-medium text-warning"
                  : "font-medium text-foreground"
              }
            >
              {d.location === "Unresolved" ? "Unresolved location" : `${d.location} taluk`}
            </span>
            <span className="tabular font-semibold">{d.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${d.location === "Unresolved" ? "bg-warning" : "bg-primary"}`}
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SummaryCard({ s }: { s: AIStructuredSummary }) {
  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <AIBadge label="AI summary" />
        <PriorityBadge priority={s.priority} />
        <CategoryBadge category={s.category} />
        <ConfidenceMeter value={s.confidence} className="ml-auto" />
      </div>
      <h3 className="mt-2.5 text-sm font-semibold leading-snug text-foreground">{s.title}</h3>
      <dl className="mt-3 grid gap-2.5 text-xs sm:grid-cols-2">
        <SummaryField label="What happened" value={s.whatHappened} wide />
        <SummaryField label="Where" value={s.where} />
        <SummaryField label="When" value={s.when} />
        <SummaryField label="Why it matters" value={s.whyImportant} wide />
        <SummaryField label="Responsible department" value={s.department} />
        <SummaryField label="Pattern" value={s.pattern} />
        <SummaryField label="Suggested follow-up" value={s.followUp} wide />
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-3 text-xs">
        <span className="text-muted-foreground">
          Based on {s.supportingArticleIds.length} article
          {s.supportingArticleIds.length === 1 ? "" : "s"}
        </span>
        {s.incidentIds.slice(0, 3).map((id) => (
          <Link
            key={id}
            to="/incidents/$incidentId"
            params={{ incidentId: id }}
            className="font-medium text-teal hover:underline"
          >
            {id}
          </Link>
        ))}
      </div>
    </article>
  );
}

function SummaryField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 leading-relaxed text-foreground">{value}</dd>
    </div>
  );
}

export function RecentNewsList({ articles }: { articles: NewsArticle[] }) {
  if (!articles.length) return <EmptyState title="No processed news yet" />;
  return (
    <ul className="-my-1 divide-y">
      {articles.map((a) => (
        <li key={a.id} className="py-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">{a.source}</span>·
            <span>{fmtDate(a.publishedDate)}</span>
            <PriorityBadge priority={a.priority} className="ml-auto" />
          </div>
          <a
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="group mt-1 flex items-start gap-1 text-sm font-medium leading-snug text-foreground hover:underline"
          >
            {a.headline}
            <ExternalLink className="mt-0.5 size-3 shrink-0 opacity-0 group-hover:opacity-60" />
          </a>
          <div className="mt-1.5 flex items-center gap-1.5">
            <CategoryBadge category={a.category} />
            {!a.location.resolved && <UnresolvedBadge />}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function DepartmentTable({ rows }: { rows: DepartmentStats[] }) {
  const sorted = [...rows].sort(
    (a, b) => b.critical - a.critical || b.activeIncidents - a.activeIncidents,
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 font-semibold">Department</th>
            <th className="pb-2 text-right font-semibold">Active</th>
            <th className="pb-2 text-right font-semibold">Critical</th>
            <th className="pb-2 text-right font-semibold">Pending</th>
            <th className="pb-2 pl-4 font-semibold">Completion</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((d) => {
            const total = d.pendingActions + d.completedActions;
            const rate = total ? d.completedActions / total : 0;
            return (
              <tr key={d.departmentId}>
                <td className="py-2.5">
                  <Link
                    to="/departments/$departmentId"
                    params={{ departmentId: d.departmentId }}
                    className="font-medium hover:underline"
                  >
                    {d.shortName}
                  </Link>
                </td>
                <td className="tabular py-2.5 text-right">{d.activeIncidents}</td>
                <td
                  className={`tabular py-2.5 text-right ${d.critical ? "font-semibold text-sev-critical" : "text-muted-foreground"}`}
                >
                  {d.critical}
                </td>
                <td className="tabular py-2.5 text-right">{d.pendingActions}</td>
                <td className="py-2.5 pl-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-success"
                        style={{ width: `${rate * 100}%` }}
                      />
                    </div>
                    <span className="tabular text-xs text-muted-foreground">
                      {total ? `${Math.round(rate * 100)}%` : "—"}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function SourceHealthPanel({ health }: { health: SourceHealth }) {
  const tiles = [
    { label: "Connected", value: health.connected, cls: "text-success" },
    { label: "Failed", value: health.failed, cls: "text-sev-critical" },
    { label: "Pending", value: health.pending, cls: "text-warning" },
    { label: "Disabled", value: health.disabled, cls: "text-muted-foreground" },
  ];
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-lg bg-muted/60 p-2.5 text-center">
            <p className={`tabular text-xl font-bold ${t.cls}`}>{t.value}</p>
            <p className="text-[11px] text-muted-foreground">{t.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Last successful sync:{" "}
        <span className="font-medium text-foreground">{fmtDateTime(health.lastSync)}</span>
      </p>
      <ul className="mt-3 divide-y text-sm">
        {health.sources
          .filter((s) => s.status !== "connected")
          .slice(0, 4)
          .map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-2 py-2">
              <span className="truncate">{s.name}</span>
              <SourceStatusBadge status={s.status} />
            </li>
          ))}
      </ul>
    </div>
  );
}

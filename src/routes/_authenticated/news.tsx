import { PipelineControls } from "@/components/modules/pipeline";
import { USE_MOCK_API } from "@/services/api/client";
import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileStack,
  Layers,
  Newspaper,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FilterBar,
  FilterSelect,
  KpiCard,
  PageHeader,
  SearchInput,
  SectionCard,
} from "@/components/dp/primitives";
import {
  AIBadge,
  CategoryBadge,
  DemoBadge,
  PriorityBadge,
  ProcessingBadge,
  UnresolvedBadge,
} from "@/components/dp/badges";
import { DataTable, type Column } from "@/components/dp/data-table";
import { EmptyState, LoadingState, QueryView } from "@/components/dp/states";
import { AXIS, ChartTooltip, GRID } from "@/components/dp/chart";
import { SummaryCard } from "@/components/widgets/overview-widgets";
import { requireRoles } from "@/lib/auth";
import { useArticles, useClusters, useNewsInsights, useSummaries } from "@/lib/queries";
import { useDistrict } from "@/lib/district";
import { categoryColor, categoryLabel, categoryOptions } from "@/lib/category";
import {
  DEMO_TODAY,
  fmtDate,
  fmtDateTime,
  fmtShortDay,
  PRIORITY_LABEL,
  PROCESSING_LABEL,
} from "@/lib/format";
import type { NewsArticle, Priority, ProcessingStatus } from "@/types";

interface NewsSearch {
  q?: string | undefined;
  tab?: string | undefined;
}

export const Route = createFileRoute("/_authenticated/news")({
  validateSearch: (s: Record<string, unknown>): NewsSearch => ({
    ...(typeof s["q"] === "string" && s["q"] ? { q: s["q"] } : {}),
    ...(typeof s["tab"] === "string" && s["tab"] ? { tab: s["tab"] } : {}),
  }),
  beforeLoad: requireRoles(["collector", "administrator"]),
  head: () => ({
    meta: [
      { title: "News Intelligence — DistrictPulse AI" },
      {
        name: "description",
        content:
          "30-day news monitoring with duplicate clustering, AI summaries and source traceability.",
      },
      { property: "og:title", content: "News Intelligence — DistrictPulse AI" },
      {
        property: "og:description",
        content:
          "30-day news monitoring with duplicate clustering, AI summaries and source traceability.",
      },
    ],
  }),
  component: NewsPage,
});

const istDay = (iso: string) =>
  new Date(new Date(iso).getTime() + 5.5 * 3600000).toISOString().slice(0, 10);
const last30Days = () => {
  const today = USE_MOCK_API
    ? DEMO_TODAY
    : new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
  const end = Date.UTC(
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)) - 1,
    Number(today.slice(8, 10)),
  );
  return Array.from({ length: 30 }, (_, k) =>
    new Date(end - (29 - k) * 86400000).toISOString().slice(0, 10),
  );
};

function NewsPage() {
  const articlesQ = useArticles();
  const { district } = useDistrict();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/news" });
  const tab = search.tab ?? "articles";

  return (
    <div>
      <PageHeader
        eyebrow={
          <>
            <span className="eyebrow">
              {district ? `${district.name} district` : "District"} · last 30 days
            </span>
            {district?.isDemo && <DemoBadge />}
          </>
        }
        title="News Intelligence"
        actions={<PipelineControls />}
        description="Regional news is collected, de-duplicated and summarised. AI output is labelled and always links back to the original articles."
      />
      <QueryView query={articlesQ}>
        {(articles) => (
          <div className="space-y-5">
            <NewsKpis articles={articles} />
            <Tabs
              value={tab}
              onValueChange={(v) =>
                void navigate({
                  search: (p) => ({ ...p, tab: v === "articles" ? undefined : v }),
                  replace: true,
                })
              }
            >
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="articles">
                  <Newspaper className="size-3.5" /> Articles
                </TabsTrigger>
                <TabsTrigger value="clusters">
                  <Layers className="size-3.5" /> Duplicate clusters
                </TabsTrigger>
                <TabsTrigger value="summaries">
                  <Sparkles className="size-3.5" /> AI summaries
                </TabsTrigger>
                <TabsTrigger value="insights">
                  <TriangleAlert className="size-3.5" /> Insights
                </TabsTrigger>
              </TabsList>
              <TabsContent value="articles" className="mt-4 space-y-5">
                <VolumeChart articles={articles} />
                <ArticlesTable articles={articles} />
              </TabsContent>
              <TabsContent value="clusters" className="mt-4">
                <ClustersTab articles={articles} />
              </TabsContent>
              <TabsContent value="summaries" className="mt-4">
                <SummariesTab articles={articles} />
              </TabsContent>
              <TabsContent value="insights" className="mt-4">
                <InsightsTab articles={articles} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </QueryView>
    </div>
  );
}

function NewsKpis({ articles }: { articles: NewsArticle[] }) {
  const n = (s: ProcessingStatus) => articles.filter((a) => a.processingStatus === s).length;
  const sources = new Set(articles.map((a) => a.source)).size;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <KpiCard
        label="Articles collected"
        value={articles.length}
        icon={Newspaper}
        hint={`${sources} news sources`}
      />
      <KpiCard
        label="Processed"
        value={n("processed")}
        icon={Sparkles}
        tone="success"
        hint="Extracted into incidents"
      />
      <KpiCard
        label="Duplicates grouped"
        value={n("duplicate")}
        icon={FileStack}
        tone="teal"
        hint="Same event, other outlets"
      />
      <KpiCard
        label="Pending / failed"
        value={`${n("pending")} / ${n("failed")}`}
        icon={TriangleAlert}
        tone="warning"
        hint="Awaiting or failed processing"
      />
    </div>
  );
}

function VolumeChart({ articles }: { articles: NewsArticle[] }) {
  const data = useMemo(() => {
    const days = last30Days();
    return days.map((date) => ({
      date,
      count: articles.filter((a) => istDay(a.publishedDate) === date).length,
    }));
  }, [articles]);
  return (
    <SectionCard
      title="30-day news volume"
      description="Articles published per day across all monitored sources"
    >
      <div className="h-44">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -24, right: 4, top: 4 }}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="date" {...AXIS} tickFormatter={fmtShortDay} interval={4} />
            <YAxis {...AXIS} allowDecimals={false} />
            <Tooltip
              content={<ChartTooltip formatLabel={fmtShortDay} />}
              cursor={{ fill: "var(--muted)" }}
            />
            <Bar dataKey="count" name="Articles" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

function ArticlesTable({ articles }: { articles: NewsArticle[] }) {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/news" });
  const [source, setSource] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [priority, setPriority] = useState<Priority | "all">("all");
  const [status, setStatus] = useState<ProcessingStatus | "all">("all");
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);
  const q = search.q ?? "";

  const sources = useMemo(() => [...new Set(articles.map((a) => a.source))].sort(), [articles]);
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return articles.filter(
      (a) =>
        (!term ||
          a.headline.toLowerCase().includes(term) ||
          a.source.toLowerCase().includes(term) ||
          a.location.name.toLowerCase().includes(term)) &&
        (source === "all" || a.source === source) &&
        (category === "all" || a.category === category) &&
        (priority === "all" || a.priority === priority) &&
        (status === "all" || a.processingStatus === status) &&
        (!unresolvedOnly || !a.location.resolved),
    );
  }, [articles, q, source, category, priority, status, unresolvedOnly]);
  const unresolvedCount = articles.filter((a) => !a.location.resolved).length;
  const filtered =
    q ||
    source !== "all" ||
    category !== "all" ||
    priority !== "all" ||
    status !== "all" ||
    unresolvedOnly;

  const columns: Column<NewsArticle>[] = [
    {
      key: "headline",
      header: "Headline",
      cell: (a) => (
        <div className="min-w-[260px] max-w-[420px]">
          <a
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-start gap-1 font-medium text-foreground hover:underline"
          >
            {a.headline}
            <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
          </a>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground" title={a.aiSummary}>
            AI: {a.aiSummary}
          </p>
        </div>
      ),
      sortValue: (a) => a.headline,
    },
    {
      key: "source",
      header: "Source",
      cell: (a) => <span className="whitespace-nowrap text-xs font-medium">{a.source}</span>,
      sortValue: (a) => a.source,
    },
    {
      key: "date",
      header: "Published",
      cell: (a) => (
        <span className="whitespace-nowrap text-xs">{fmtDateTime(a.publishedDate)}</span>
      ),
      sortValue: (a) => a.publishedDate,
    },
    {
      key: "loc",
      header: "Location",
      cell: (a) =>
        a.location.resolved ? (
          <span className="text-xs">{a.location.name}</span>
        ) : (
          <UnresolvedBadge />
        ),
      sortValue: (a) => (a.location.resolved ? a.location.name : "zzz"),
    },
    {
      key: "cat",
      header: "Category",
      cell: (a) => <CategoryBadge category={a.category} />,
      sortValue: (a) => categoryLabel(a.category),
    },
    {
      key: "pri",
      header: "Priority",
      cell: (a) => <PriorityBadge priority={a.priority} />,
      sortValue: (a) => ({ critical: 3, high: 2, medium: 1, low: 0 })[a.priority],
    },
    {
      key: "proc",
      header: "Processing",
      cell: (a) => <ProcessingBadge status={a.processingStatus} />,
      sortValue: (a) => a.processingStatus,
    },
    {
      key: "inc",
      header: "Incident",
      cell: (a) =>
        a.incidentId ? (
          <Link
            to="/incidents/$incidentId"
            params={{ incidentId: a.incidentId }}
            className="whitespace-nowrap font-mono text-xs text-teal hover:underline"
          >
            {a.incidentId}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <SectionCard
      title={`Articles · ${rows.length} of ${articles.length}`}
      description="Headline links open the original publication."
      actions={
        filtered ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSource("all");
              setCategory("all");
              setPriority("all");
              setStatus("all");
              setUnresolvedOnly(false);
              void navigate({ search: (p) => ({ ...p, q: undefined }), replace: true });
            }}
          >
            <X className="size-3.5" /> Clear
          </Button>
        ) : undefined
      }
    >
      <FilterBar>
        <SearchInput
          value={q}
          onChange={(v) =>
            void navigate({ search: (p) => ({ ...p, q: v || undefined }), replace: true })
          }
          placeholder="Search headline, source, place…"
          className="sm:w-64"
        />
        <FilterSelect
          label="Source"
          value={source}
          onChange={setSource}
          allLabel="All sources"
          options={sources.map((s) => ({ value: s, label: s }))}
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          allLabel="All categories"
          options={categoryOptions(articles)}
        />
        <FilterSelect
          label="Priority"
          value={priority}
          onChange={setPriority}
          allLabel="All priorities"
          options={(Object.keys(PRIORITY_LABEL) as Priority[]).map((p) => ({
            value: p,
            label: PRIORITY_LABEL[p],
          }))}
        />
        <FilterSelect
          label="Processing"
          value={status}
          onChange={setStatus}
          allLabel="Any processing"
          options={(Object.keys(PROCESSING_LABEL) as ProcessingStatus[]).map((p) => ({
            value: p,
            label: PROCESSING_LABEL[p],
          }))}
        />
        {unresolvedCount > 0 && (
          <Button
            variant={unresolvedOnly ? "default" : "outline"}
            size="sm"
            className="h-9"
            onClick={() => setUnresolvedOnly((v) => !v)}
            aria-pressed={unresolvedOnly}
          >
            Unresolved locations ({unresolvedCount})
          </Button>
        )}
      </FilterBar>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(a) => a.id}
        pageSize={12}
        initialSort={{ key: "date", dir: "desc" }}
      />
    </SectionCard>
  );
}

function ClustersTab({ articles }: { articles: NewsArticle[] }) {
  const q = useClusters();
  const [open, setOpen] = useState<string | null>(null);
  const byId = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  return (
    <QueryView
      query={q}
      loading={<LoadingState variant="cards" rows={4} />}
      empty={
        <EmptyState
          title="No duplicate clusters"
          description="No event was reported by more than one outlet in this period."
        />
      }
    >
      {(clusters) => (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {clusters.length} events were reported by several outlets. Each cluster is grouped by
            similarity matching and merged into one incident.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {clusters.map((c) => {
              const expanded = open === c.id;
              const items = c.articleIds
                .map((id) => byId.get(id))
                .filter((a): a is NewsArticle => !!a);
              return (
                <article key={c.id} className="surface-card p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[11px] text-muted-foreground">{c.id}</span>
                    <PriorityBadge priority={c.priority} />
                    <CategoryBadge category={c.category} />
                    <span className="ml-auto rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {c.articleIds.length} articles
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{c.title}</h3>
                  <div className="mt-2 rounded-lg bg-ai-soft/60 p-3">
                    <AIBadge label="Combined AI summary" />
                    <p className="mt-1.5 text-xs leading-relaxed text-foreground">
                      {c.combinedSummary}
                    </p>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <dt className="text-muted-foreground">First reported</dt>
                      <dd className="font-medium">{fmtDateTime(c.firstReported)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Latest report</dt>
                      <dd className="font-medium">{fmtDateTime(c.latestReported)}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Outlets</dt>
                      <dd className="font-medium">{c.sources.join(", ")}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: c.incidentId }}
                      className="text-xs font-medium text-teal hover:underline"
                    >
                      Incident {c.incidentId}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpen(expanded ? null : c.id)}
                      aria-expanded={expanded}
                    >
                      {expanded ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}{" "}
                      Source articles
                    </Button>
                  </div>
                  {expanded && (
                    <ul className="mt-2 divide-y rounded-lg border">
                      {items.map((a) => (
                        <li key={a.id} className="px-3 py-2">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-start gap-1 text-xs font-medium hover:underline"
                          >
                            {a.headline}{" "}
                            <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                          </a>
                          <p className="text-[11px] text-muted-foreground">
                            {a.source} · {fmtDateTime(a.publishedDate)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </QueryView>
  );
}

function SummariesTab({ articles }: { articles: NewsArticle[] }) {
  const q = useSummaries();
  const byId = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  return (
    <QueryView
      query={q}
      loading={<LoadingState variant="cards" rows={4} />}
      empty={<EmptyState title="No AI summaries yet" />}
    >
      {(summaries) => (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <AIBadge /> Structured summaries are machine-generated. Check the supporting articles
            before acting.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {summaries.map((s) => (
              <div key={s.id} className="space-y-2">
                <SummaryCard s={s} />
                <div className="rounded-lg border bg-muted/40 px-4 py-2.5">
                  <p className="eyebrow mb-1.5">Supporting sources</p>
                  <ul className="space-y-1">
                    {s.supportingArticleIds.map((id) => {
                      const a = byId.get(id);
                      return (
                        <li key={id} className="text-xs">
                          {a ? (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-start gap-1 hover:underline"
                            >
                              <span className="font-semibold">{a.source}:</span> {a.headline}
                              <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">
                              Article {id} (outside 30-day window)
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </QueryView>
  );
}

function InsightsTab({ articles }: { articles: NewsArticle[] }) {
  const q = useNewsInsights();
  const byId = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  return (
    <QueryView
      query={q}
      loading={<LoadingState variant="cards" rows={6} />}
      empty={<EmptyState title="No insights yet" />}
    >
      {(ins) => {
        const maxLoc = Math.max(1, ...ins.frequentLocations.map((l) => l.count));
        const catData = ins.categoryFrequency
          .filter((c) => c.count > 0)
          .map((c) => ({
            name: categoryLabel(c.category),
            count: c.count,
            fill: categoryColor(c.category),
          }));
        return (
          <div className="space-y-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <AIBadge label="AI-derived insights" /> Patterns detected across the last 30 days of
              coverage.
            </p>
            <div className="grid gap-5 lg:grid-cols-3">
              <SectionCard title="Recurring issues">
                <ul className="space-y-2">
                  {ins.recurringIssues.map((r) => (
                    <li key={r.label} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <CategoryBadge category={r.category} />
                        <span className="truncate">{r.label}</span>
                      </span>
                      <span className="tabular font-semibold">{r.count}×</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title="Emerging patterns">
                <ul className="space-y-3">
                  {ins.emergingPatterns.map((p) => (
                    <li key={p.label}>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">{p.detail}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
              <SectionCard title="Most-reported locations">
                <ul className="space-y-2.5">
                  {ins.frequentLocations.map((l) => (
                    <li key={l.location}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span
                          className={
                            l.location.toLowerCase().includes("unresolved")
                              ? "text-warning"
                              : undefined
                          }
                        >
                          {l.location}
                        </span>
                        <span className="tabular font-semibold">{l.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(l.count / maxLoc) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              <SectionCard className="lg:col-span-2" title="Coverage by category">
                <div className="h-56">
                  <ResponsiveContainer>
                    <BarChart data={catData} layout="vertical" margin={{ left: 24, right: 12 }}>
                      <CartesianGrid {...GRID} horizontal={false} vertical />
                      <XAxis type="number" {...AXIS} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" {...AXIS} width={110} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                      <Bar dataKey="count" name="Articles" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
              <SectionCard title="Department concerns">
                <ul className="divide-y">
                  {ins.departmentConcerns.map((d) => (
                    <li
                      key={d.departmentId}
                      className="flex items-center justify-between py-2 text-sm"
                    >
                      <Link
                        to="/departments/$departmentId"
                        params={{ departmentId: d.departmentId }}
                        className="hover:underline"
                      >
                        {d.department}
                      </Link>
                      <span className="tabular font-semibold">{d.count}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            </div>
            <SectionCard title="Notable developments" bodyClassName="py-2">
              <ul className="divide-y">
                {ins.developments.map((d) => {
                  const a = byId.get(d.articleId);
                  return (
                    <li key={d.label} className="py-3">
                      <p className="text-sm font-medium">{d.label}</p>
                      <p className="text-xs text-muted-foreground">{d.detail}</p>
                      {a && (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs text-teal hover:underline"
                        >
                          Source: {a.source}, {fmtDate(a.publishedDate)}{" "}
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </SectionCard>
          </div>
        );
      }}
    </QueryView>
  );
}

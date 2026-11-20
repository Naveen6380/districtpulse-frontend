import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionCard } from "@/components/dp/primitives";
import { AIBadge, DemoBadge } from "@/components/dp/badges";
import { QueryView } from "@/components/dp/states";
import {
  CategoryDonut,
  CriticalAlertsList,
  DepartmentTable,
  KpiGrid,
  LocationBars,
  RecentNewsList,
  SourceHealthPanel,
  SummaryCard,
  TrendChart,
} from "@/components/widgets/overview-widgets";
import { useOverview } from "@/lib/queries";
import { useDistrict } from "@/lib/district";
import { canAccess, useSession } from "@/lib/auth";
import { DEMO_TODAY, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/overview")({
  head: () => ({
    meta: [
      { title: "District Overview — DistrictPulse AI" },
      {
        name: "description",
        content:
          "Real-time district situation: incidents, alerts, trends and department performance.",
      },
      { property: "og:title", content: "District Overview — DistrictPulse AI" },
      {
        property: "og:description",
        content:
          "Real-time district situation: incidents, alerts, trends and department performance.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const q = useOverview();
  const { district } = useDistrict();
  const session = useSession();
  const lead = canAccess(session?.user.role, ["collector", "administrator"]);

  return (
    <div>
      <PageHeader
        eyebrow={
          <>
            <span className="eyebrow">{district ? `${district.name} district` : "District"}</span>
            {district?.isDemo && <DemoBadge />}
          </>
        }
        title="District Overview"
        description={`Situation as of ${fmtDate(district?.isDemo ? DEMO_TODAY : new Date().toISOString())}. Counts are derived from the same incident, action and news records shown in each module.`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void q.refetch()}
              disabled={q.isFetching}
            >
              <RefreshCw className={q.isFetching ? "size-3.5 animate-spin" : "size-3.5"} /> Refresh
            </Button>
            {lead && (
              <Button size="sm" asChild>
                <Link to="/reports">
                  <FileText className="size-3.5" /> Generate briefing
                </Link>
              </Button>
            )}
          </>
        }
      />
      <QueryView query={q}>
        {(d) => (
          <div className="space-y-5">
            <KpiGrid kpis={d.kpis} />

            <div className="grid gap-5 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title="Critical & high-priority alerts"
                description="Active incidents ranked by severity, then recency"
                actions={
                  <Link to="/incidents" className="text-xs font-medium text-teal hover:underline">
                    View all
                  </Link>
                }
                bodyClassName="py-2"
              >
                <CriticalAlertsList incidents={d.criticalAlerts} />
              </SectionCard>
              <SectionCard
                title="Incidents by category"
                description="All non-rejected incidents, last 30 days"
              >
                <CategoryDonut data={d.byCategory} />
              </SectionCard>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title="Incident trend"
                description="Daily reported incidents, last 30 days"
              >
                <TrendChart data={d.daily} />
              </SectionCard>
              <SectionCard
                title="Incidents by taluk"
                description="Unresolved places are kept separate, never guessed"
              >
                <LocationBars data={d.byLocation} />
              </SectionCard>
            </div>

            <SectionCard
              title={
                <span className="flex items-center gap-2">
                  AI intelligence summaries <AIBadge />
                </span>
              }
              description="Generated from clustered news reports. Verify before acting — every summary lists its supporting sources."
              actions={
                lead ? (
                  <Link to="/news" className="text-xs font-medium text-teal hover:underline">
                    News Intelligence
                  </Link>
                ) : undefined
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                {d.summaries.map((s) => (
                  <SummaryCard key={s.id} s={s} />
                ))}
              </div>
            </SectionCard>

            <div className="grid gap-5 lg:grid-cols-3">
              <SectionCard
                className="lg:col-span-2"
                title="Department performance"
                description="Active incidents and action completion by department"
                actions={
                  <Link to="/departments" className="text-xs font-medium text-teal hover:underline">
                    All departments
                  </Link>
                }
              >
                <DepartmentTable rows={d.departments} />
              </SectionCard>
              <div className="space-y-5">
                <SectionCard
                  title="Recent news"
                  description="Latest processed articles"
                  bodyClassName="py-2"
                >
                  <RecentNewsList articles={d.recentNews.slice(0, 4)} />
                </SectionCard>
                <SectionCard title="Data source health">
                  <SourceHealthPanel health={d.sourceHealth} />
                </SectionCard>
              </div>
            </div>
          </div>
        )}
      </QueryView>
    </div>
  );
}

import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  History,
  Link2,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, PageHeader, SectionCard } from "@/components/dp/primitives";
import {
  ActionStatusBadge,
  AIBadge,
  CategoryBadge,
  ConfidenceMeter,
  DemoBadge,
  IncidentStatusBadge,
  PriorityBadge,
  ProcessingBadge,
  UnresolvedBadge,
  VerificationBadge,
} from "@/components/dp/badges";
import { EmptyState, LoadingState } from "@/components/dp/states";
import { CreateActionDialog } from "@/components/actions/CreateActionDialog";
import {
  useActions,
  useAssignDepartment,
  useDepartments,
  useIncident,
  useSetVerification,
} from "@/lib/queries";
import { canAccess, useSession } from "@/lib/auth";
import { fmtDate, fmtDateTime, isOverdue } from "@/lib/format";
import type { Incident, VerificationStatus } from "@/types";

export const Route = createFileRoute("/_authenticated/incidents/$incidentId")({
  head: () => ({
    meta: [
      { title: "Incident Detail — DistrictPulse AI" },
      {
        name: "description",
        content:
          "Incident detail with AI summary, supporting source articles, history and verification.",
      },
      { property: "og:title", content: "Incident Detail — DistrictPulse AI" },
      {
        property: "og:description",
        content:
          "Incident detail with AI summary, supporting source articles, history and verification.",
      },
    ],
  }),
  component: IncidentDetailPage,
});

function IncidentDetailPage() {
  const { incidentId } = Route.useParams();
  const q = useIncident(incidentId);

  if (q.isPending) return <LoadingState variant="page" />;
  if (q.isError)
    return (
      <EmptyState
        title="Incident not found"
        description={`No incident with ID ${incidentId} exists for this district, or it could not be loaded.`}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/incidents">
              <ArrowLeft className="size-3.5" /> Back to incidents
            </Link>
          </Button>
        }
      />
    );
  const { incident: i, articles, related } = q.data;

  return (
    <div>
      <Link
        to="/incidents"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All incidents
      </Link>
      <PageHeader
        eyebrow={
          <>
            <span className="font-mono text-xs text-muted-foreground">{i.id}</span>
            <PriorityBadge priority={i.priority} />
            <CategoryBadge category={i.category} />
            <IncidentStatusBadge status={i.status} />
            <VerificationBadge status={i.verification} />
            {i.isDemo && <DemoBadge />}
          </>
        }
        title={i.title}
        description={`Reported ${fmtDateTime(i.reportedDate)} · ${i.sourceCount} independent source${i.sourceCount === 1 ? "" : "s"}`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="Description">
            <p className="text-sm leading-relaxed text-foreground">{i.description}</p>
            {i.historicalNote && (
              <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Historical context: </span>
                {i.historicalNote}
              </p>
            )}
          </SectionCard>

          <section className="rounded-xl border border-ai/25 bg-ai-soft/50 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <AIBadge label="AI summary" />
              <ConfidenceMeter value={i.confidence} />
              <span className="text-xs text-muted-foreground">
                AI-extracted — verify before acting
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground">{i.aiSummary}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Generated from {articles.length} supporting article{articles.length === 1 ? "" : "s"}{" "}
              listed below.
            </p>
          </section>

          <SectionCard
            title={`Supporting source articles · ${articles.length}`}
            description="Original reports this incident was built from. Open the link to read the source."
            bodyClassName="py-2"
          >
            {articles.length === 0 ? (
              <EmptyState
                title="No linked articles"
                description="This incident was entered without a news source."
              />
            ) : (
              <ul className="divide-y">
                {[...articles]
                  .sort((a, b) => a.publishedDate.localeCompare(b.publishedDate))
                  .map((a) => (
                    <li key={a.id} className="py-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">{a.source}</span>·
                        <span>{fmtDateTime(a.publishedDate)}</span>
                        <ProcessingBadge status={a.processingStatus} />
                        {a.isDemo && <DemoBadge label="Demo article" />}
                      </div>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-start gap-1 text-sm font-medium text-foreground hover:underline"
                      >
                        {a.headline}
                        <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      </a>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        <AIBadge label="AI" className="mr-1.5 align-middle" />
                        {a.aiSummary}
                      </p>
                    </li>
                  ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <History className="size-4 text-muted-foreground" /> Status history
              </span>
            }
          >
            <ol className="relative space-y-4 border-l pl-5">
              {[...i.history]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((h, k) => (
                  <li key={`${h.date}-${k}`} className="relative">
                    <span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-card bg-teal" />
                    <p className="text-sm text-foreground">{h.event}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {fmtDateTime(h.date)} · {h.actor}
                    </p>
                  </li>
                ))}
            </ol>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Location">
            {i.location.resolved ? (
              <dl className="grid grid-cols-2 gap-3">
                <Field label="Place">{i.location.name}</Field>
                <Field label="Taluk">{i.location.taluk}</Field>
                <Field label="Coordinates">
                  <span className="font-mono text-xs">
                    {i.location.lat?.toFixed(3)}, {i.location.lng?.toFixed(3)}
                  </span>
                </Field>
                <Field label="Map">
                  <Link
                    to="/map"
                    className="inline-flex items-center gap-1 text-teal hover:underline"
                  >
                    <MapPin className="size-3.5" /> View on map
                  </Link>
                </Field>
              </dl>
            ) : (
              <div className="space-y-2">
                <UnresolvedBadge />
                <p className="text-sm">As reported: “{i.location.name}”</p>
                <p className="text-xs text-muted-foreground">
                  The source did not name a precise place, so this incident is not plotted on the
                  map. Confirm the location before assigning field teams.
                </p>
              </div>
            )}
          </SectionCard>

          <VerificationPanel incident={i} />
          <AssignmentPanel incident={i} />
          <LinkedActions incident={i} />

          {related.length > 0 && (
            <SectionCard
              title={
                <span className="flex items-center gap-2">
                  <Link2 className="size-4 text-muted-foreground" /> Related incidents
                </span>
              }
              bodyClassName="py-2"
            >
              <ul className="divide-y">
                {related.map((r) => (
                  <li key={r.id} className="py-2.5">
                    <Link
                      to="/incidents/$incidentId"
                      params={{ incidentId: r.id }}
                      className="text-sm font-medium hover:underline"
                    >
                      {r.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>
                      <PriorityBadge priority={r.priority} />
                      <IncidentStatusBadge status={r.status} />
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

const VERIFY_OPTIONS: {
  v: VerificationStatus;
  label: string;
  icon: typeof ShieldCheck;
  variant: "default" | "outline" | "destructive";
}[] = [
  { v: "verified", label: "Mark verified", icon: ShieldCheck, variant: "default" },
  { v: "needs_review", label: "Needs review", icon: ShieldQuestion, variant: "outline" },
  { v: "rejected", label: "Reject", icon: ShieldX, variant: "destructive" },
];

function VerificationPanel({ incident }: { incident: Incident }) {
  const session = useSession();
  const canEdit = canAccess(session?.user.role, ["collector", "administrator"]);
  const [note, setNote] = useState("");
  const setVer = useSetVerification();
  const [pending, setPending] = useState<VerificationStatus | null>(null);

  const apply = async (v: VerificationStatus) => {
    setPending(v);
    try {
      const trimmed = note.trim();
      await setVer.mutateAsync({
        id: incident.id,
        verification: v,
        ...(trimmed ? { note: trimmed } : {}),
      });
      setNote("");
    } finally {
      setPending(null);
    }
  };

  return (
    <SectionCard
      title="Verification"
      description="AI-extracted incidents should be confirmed by an officer before action."
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Current status</span>
        <VerificationBadge status={incident.verification} />
      </div>
      {canEdit ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ver-note" className="text-xs">
              Note (optional, saved to history)
            </Label>
            <Textarea
              id="ver-note"
              rows={2}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Confirmed with Tahsildar by phone"
            />
          </div>
          <div className="grid gap-2">
            {VERIFY_OPTIONS.map((o) => (
              <Button
                key={o.v}
                variant={o.variant}
                size="sm"
                disabled={setVer.isPending || incident.verification === o.v}
                onClick={() => void apply(o.v)}
              >
                {pending === o.v ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <o.icon className="size-3.5" />
                )}
                {o.label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Only the Collector's office or administrators can change verification.
        </p>
      )}
    </SectionCard>
  );
}

function AssignmentPanel({ incident }: { incident: Incident }) {
  const session = useSession();
  const canEdit = canAccess(session?.user.role, ["collector", "administrator"]);
  const { data: depts = [] } = useDepartments();
  const assign = useAssignDepartment();
  const current = depts.find((d) => d.departmentId === incident.departmentId);
  return (
    <SectionCard title="Responsible department">
      {canEdit ? (
        <Select
          value={incident.departmentId}
          onValueChange={(v) => assign.mutate({ id: incident.id, departmentId: v })}
          disabled={assign.isPending}
        >
          <SelectTrigger aria-label="Assign department">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {depts.map((d) => (
              <SelectItem key={d.departmentId} value={d.departmentId}>
                {d.department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm font-medium">{current?.department ?? incident.departmentId}</p>
      )}
      {current && (
        <Link
          to="/departments/$departmentId"
          params={{ departmentId: current.departmentId }}
          className="mt-2 inline-block text-xs text-teal hover:underline"
        >
          View department workload
        </Link>
      )}
    </SectionCard>
  );
}

function LinkedActions({ incident }: { incident: Incident }) {
  const { data: actions = [] } = useActions();
  const linked = actions.filter((a) => a.incidentId === incident.id);
  return (
    <SectionCard
      title={`Actions · ${linked.length}`}
      actions={
        <CreateActionDialog
          defaults={{
            title: `Follow up: ${incident.title}`.slice(0, 120),
            departmentId: incident.departmentId,
            priority: incident.priority,
            incidentId: incident.id,
          }}
          trigger={
            <Button size="sm" variant="outline">
              <Plus className="size-3.5" /> New action
            </Button>
          }
        />
      }
      bodyClassName="py-2"
    >
      {linked.length === 0 ? (
        <p className="py-3 text-xs text-muted-foreground">
          No actions linked to this incident yet.
        </p>
      ) : (
        <ul className="divide-y">
          {linked.map((a) => (
            <li key={a.id} className="py-2.5">
              <Link
                to="/actions"
                search={{ q: a.id }}
                className="text-sm font-medium hover:underline"
              >
                {a.title}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <ActionStatusBadge status={a.status} />
                <span>Due {fmtDate(a.dueDate)}</span>
                {isOverdue(a.dueDate, a.status) && (
                  <span className="font-semibold text-sev-critical">Overdue</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

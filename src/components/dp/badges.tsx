// Status / severity / provenance badges used across every module.
import {
  Sparkles,
  FlaskConical,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ShieldX,
} from "lucide-react";
import type {
  ActionStatus,
  Category,
  IncidentStatus,
  Priority,
  ProcessingStatus,
  SourceStatus,
  VerificationStatus,
} from "@/types";
import {
  ACTION_STATUS_LABEL,
  INCIDENT_STATUS_LABEL,
  PRIORITY_LABEL,
  PROCESSING_LABEL,
  SOURCE_STATUS_LABEL,
  VERIFICATION_LABEL,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { categoryColor, categoryLabel } from "@/lib/category";

const pill =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-5";

const PRIORITY_CLASS: Record<Priority, string> = {
  critical: "bg-sev-critical-soft text-sev-critical ring-1 ring-inset ring-sev-critical/25",
  high: "bg-sev-high-soft text-sev-high ring-1 ring-inset ring-sev-high/25",
  medium: "bg-sev-medium-soft text-sev-medium ring-1 ring-inset ring-sev-medium/30",
  low: "bg-sev-low-soft text-sev-low ring-1 ring-inset ring-sev-low/25",
};
const PRIORITY_DOT: Record<Priority, string> = {
  critical: "bg-sev-critical",
  high: "bg-sev-high",
  medium: "bg-sev-medium",
  low: "bg-sev-low",
};

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn(pill, PRIORITY_CLASS[priority], className)}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          PRIORITY_DOT[priority],
          priority === "critical" && "animate-pulse",
        )}
      />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function CategoryBadge({
  category,
  className,
}: {
  category: Category | string;
  className?: string;
}) {
  return (
    <span className={cn(pill, "bg-muted text-foreground/80", className)}>
      <span className="size-2 rounded-sm" style={{ background: categoryColor(category) }} />
      {categoryLabel(category)}
    </span>
  );
}

const INC_STATUS_CLASS: Record<IncidentStatus, string> = {
  new: "bg-primary-soft text-primary",
  under_investigation: "bg-warning-soft text-warning",
  action_assigned: "bg-teal-soft text-teal",
  resolved: "bg-success-soft text-success",
  closed: "bg-muted text-muted-foreground",
};
export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return (
    <span className={cn(pill, INC_STATUS_CLASS[status])}>{INCIDENT_STATUS_LABEL[status]}</span>
  );
}

const VER_ICON = {
  ai_extracted: Sparkles,
  verified: ShieldCheck,
  needs_review: ShieldQuestion,
  rejected: ShieldX,
} as const;
const VER_CLASS: Record<VerificationStatus, string> = {
  ai_extracted: "bg-ai-soft text-ai",
  verified: "bg-success-soft text-success",
  needs_review: "bg-warning-soft text-warning",
  rejected: "bg-sev-critical-soft text-sev-critical",
};
export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const Icon = VER_ICON[status];
  return (
    <span className={cn(pill, VER_CLASS[status])}>
      <Icon className="size-3" />
      {VERIFICATION_LABEL[status]}
    </span>
  );
}

const ACT_CLASS: Record<ActionStatus, string> = {
  open: "bg-primary-soft text-primary",
  in_progress: "bg-teal-soft text-teal",
  under_review: "bg-warning-soft text-warning",
  completed: "bg-success-soft text-success",
  on_hold: "bg-muted text-muted-foreground",
};
export function ActionStatusBadge({ status }: { status: ActionStatus }) {
  return <span className={cn(pill, ACT_CLASS[status])}>{ACTION_STATUS_LABEL[status]}</span>;
}

const SRC_CLASS: Record<SourceStatus, string> = {
  connected: "bg-success-soft text-success",
  failed: "bg-sev-critical-soft text-sev-critical",
  disabled: "bg-muted text-muted-foreground",
  pending: "bg-warning-soft text-warning",
};
const SRC_DOT: Record<SourceStatus, string> = {
  connected: "bg-success",
  failed: "bg-sev-critical",
  disabled: "bg-muted-foreground",
  pending: "bg-warning",
};
export function SourceStatusBadge({ status }: { status: SourceStatus }) {
  return (
    <span className={cn(pill, SRC_CLASS[status])}>
      <span className={cn("size-1.5 rounded-full", SRC_DOT[status])} />
      {SOURCE_STATUS_LABEL[status]}
    </span>
  );
}

const PROC_CLASS: Record<ProcessingStatus, string> = {
  processed: "bg-success-soft text-success",
  duplicate: "bg-primary-soft text-primary",
  pending: "bg-warning-soft text-warning",
  failed: "bg-sev-critical-soft text-sev-critical",
};
export function ProcessingBadge({ status }: { status: ProcessingStatus }) {
  return <span className={cn(pill, PROC_CLASS[status])}>{PROCESSING_LABEL[status]}</span>;
}

/** Marks content produced by the AI pipeline so it is never mistaken for verified fact. */
export function AIBadge({
  label = "AI-generated",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span className={cn(pill, "bg-ai-soft text-ai ring-1 ring-inset ring-ai/20", className)}>
      <Sparkles className="size-3" />
      {label}
    </span>
  );
}

export function DemoBadge({
  className,
  label = "Demo data",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn(pill, "bg-demo-soft text-demo ring-1 ring-inset ring-demo/25", className)}>
      <FlaskConical className="size-3" />
      {label}
    </span>
  );
}

export function UnresolvedBadge() {
  return (
    <span className={cn(pill, "bg-warning-soft text-warning")}>
      <ShieldAlert className="size-3" />
      Location unresolved
    </span>
  );
}

/** Confidence 0–1 rendered as a compact meter with explicit percentage. */
export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  const p = Math.round(value * 100);
  const tone = p >= 80 ? "bg-success" : p >= 60 ? "bg-warning" : "bg-sev-critical";
  return (
    <span className={cn("inline-flex items-center gap-2", className)} title={`AI confidence ${p}%`}>
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <span className={cn("block h-full rounded-full", tone)} style={{ width: `${p}%` }} />
      </span>
      <span className="tabular text-xs font-medium text-muted-foreground">{p}%</span>
    </span>
  );
}

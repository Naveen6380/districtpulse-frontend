import { USE_MOCK_API } from "@/services/api/client";
import type {
  ActionStatus,
  Category,
  IncidentStatus,
  Priority,
  ProcessingStatus,
  Role,
  SourceStatus,
  SourceType,
  VerificationStatus,
} from "@/types";

const IST = "Asia/Kolkata";

export function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T00:00:00+05:30`) : new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: IST,
  });
}

export function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IST,
  });
}

export function fmtShortDay(isoDay: string) {
  return new Date(`${isoDay}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: IST,
  });
}

export const fmtNum = (n: number) => n.toLocaleString("en-IN");
export const pct = (n: number) => `${Math.round(n * 100)}%`;

export const CATEGORY_LABEL: Record<Category, string> = {
  flood: "Flood",
  weather: "Weather",
  agriculture: "Agriculture",
  infrastructure: "Infrastructure",
  grievance: "Public Grievances",
  health: "Health",
  education: "Education",
  public_safety: "Public Safety",
  governance: "Governance",
  other: "Other",
};

export const CATEGORY_COLOR: Record<Category, string> = {
  flood: "var(--cat-flood)",
  weather: "var(--cat-weather)",
  agriculture: "var(--cat-agriculture)",
  infrastructure: "var(--cat-infrastructure)",
  grievance: "var(--cat-grievance)",
  health: "var(--cat-health)",
  education: "var(--cat-education)",
  public_safety: "var(--cat-public_safety)",
  governance: "var(--cat-governance)",
  other: "var(--cat-other)",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};
export const PRIORITY_ORDER: Record<Priority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
export const PRIORITY_COLOR: Record<Priority, string> = {
  critical: "var(--sev-critical)",
  high: "var(--sev-high)",
  medium: "var(--sev-medium)",
  low: "var(--sev-low)",
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  new: "New",
  under_investigation: "Under investigation",
  action_assigned: "Action assigned",
  resolved: "Resolved",
  closed: "Closed",
};

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  ai_extracted: "AI-extracted",
  verified: "Verified",
  needs_review: "Needs review",
  rejected: "Rejected",
};

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  under_review: "Under Review",
  completed: "Completed",
  on_hold: "On Hold",
};

export const PROCESSING_LABEL: Record<ProcessingStatus, string> = {
  processed: "Processed",
  duplicate: "Duplicate grouped",
  pending: "Pending",
  failed: "Failed",
};

export const SOURCE_STATUS_LABEL: Record<SourceStatus, string> = {
  connected: "Connected",
  failed: "Failed",
  disabled: "Disabled",
  pending: "Pending setup",
};

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  rest_api: "REST API",
  public_webpage: "Public webpage",
  csv: "CSV",
  excel: "Excel",
  json: "JSON",
  xml: "XML",
  document_upload: "Document upload",
};

export const ROLE_LABEL: Record<Role, string> = {
  collector: "Collector",
  administrator: "Administrator",
  department_officer: "Department Officer",
};

/** Today in the demo timeline (fixed so demo data stays consistent). */
export const DEMO_TODAY = "2026-11-06";

export const isOverdue = (dueDate: string, status: ActionStatus) =>
  status !== "completed" &&
  dueDate <
    (USE_MOCK_API ? DEMO_TODAY : new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10));

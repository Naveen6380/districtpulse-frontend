// Page scaffolding primitives: header, section card, KPI card, filter controls.
import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Search, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 flex flex-wrap items-center gap-2">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("surface-card flex flex-col", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn("flex-1 p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

const TONE: Record<string, string> = {
  default: "bg-primary-soft text-primary",
  critical: "bg-sev-critical-soft text-sev-critical",
  high: "bg-sev-high-soft text-sev-high",
  warning: "bg-warning-soft text-warning",
  teal: "bg-teal-soft text-teal",
  success: "bg-success-soft text-success",
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  delta,
  to,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof TONE;
  hint?: ReactNode;
  /** Positive = increase. `goodWhenDown` flips the colouring. */
  delta?: { value: number; label: string; goodWhenDown?: boolean };
  to?: LinkProps["to"];
}) {
  const body = (
    <div className="surface-card group relative h-full overflow-hidden p-4 transition-shadow hover:shadow-raised">
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", TONE[tone])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="tabular mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-semibold",
              delta.value === 0
                ? "text-muted-foreground"
                : delta.value > 0 !== !!delta.goodWhenDown
                  ? "text-success"
                  : "text-sev-critical",
            )}
          >
            {delta.value > 0 ? (
              <ArrowUpRight className="size-3.5" />
            ) : delta.value < 0 ? (
              <ArrowDownRight className="size-3.5" />
            ) : null}
            {delta.value > 0 ? "+" : ""}
            {delta.value}
          </span>
        )}
        <span className="truncate">{delta?.label ?? hint}</span>
      </div>
    </div>
  );
  if (!to) return body;
  return (
    <Link
      to={to}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {body}
    </Link>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 bg-card pl-8"
        aria-label={placeholder}
      />
    </div>
  );
}

export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  allLabel,
  className,
  label,
}: {
  value: T | "all";
  onChange: (v: T | "all") => void;
  options: { value: T; label: string }[];
  allLabel: string;
  className?: string;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as T | "all")}>
      <SelectTrigger
        className={cn("h-9 w-full bg-card sm:w-[170px]", className)}
        aria-label={label}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn("mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}
    >
      {children}
    </div>
  );
}

/** Small label/value pair for detail panels. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}

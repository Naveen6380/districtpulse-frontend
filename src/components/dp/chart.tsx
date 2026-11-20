// Shared Recharts styling so every chart reads the design tokens.
import type { ReactNode } from "react";

export const AXIS = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;
export const GRID = { stroke: "var(--border)", strokeDasharray: "3 3", vertical: false } as const;

export function ChartTooltip({
  active,
  payload,
  label,
  formatLabel,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number | string; color?: string }[];
  label?: string | number;
  formatLabel?: (l: string) => ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-raised">
      {label !== undefined && (
        <p className="mb-1 font-semibold text-foreground">
          {formatLabel ? formatLabel(String(label)) : label}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-sm" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="tabular ml-auto font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; color: string; value?: ReactNode }[];
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
          {it.value !== undefined && (
            <span className="tabular font-semibold text-foreground">{it.value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

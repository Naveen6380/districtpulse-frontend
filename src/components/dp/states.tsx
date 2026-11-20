// Loading / empty / error states, plus a small helper that picks the right one for a query.
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  variant = "cards",
  rows = 6,
  className,
}: {
  variant?: "cards" | "table" | "chart" | "page";
  rows?: number;
  className?: string;
}) {
  if (variant === "table") {
    return (
      <div className={cn("space-y-2", className)} aria-busy="true" aria-label="Loading">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </div>
    );
  }
  if (variant === "chart")
    return (
      <Skeleton className={cn("h-64 w-full", className)} aria-busy="true" aria-label="Loading" />
    );
  if (variant === "page") {
    return (
      <div className={cn("space-y-4", className)} aria-busy="true" aria-label="Loading">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

export function EmptyState({
  title = "Nothing to show",
  description,
  icon,
  action,
  className,
}: {
  title?: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const message = error instanceof Error ? error.message : "The service did not respond.";
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-sev-critical-soft/40 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-sev-critical-soft text-sev-critical">
        <AlertTriangle className="size-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">Couldn't load this data</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw className="size-3.5" /> Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Renders loading / error / empty for a query and hands the data to `children` otherwise.
 * `isEmpty` decides when data should be treated as "no data for this district".
 */
export function QueryView<T>({
  query,
  children,
  isEmpty,
  loading,
  empty,
}: {
  query: UseQueryResult<T>;
  children: (data: NonNullable<T>) => ReactNode;
  isEmpty?: (data: T) => boolean;
  loading?: ReactNode;
  empty?: ReactNode;
}) {
  if (query.isPending) return <>{loading ?? <LoadingState variant="page" />}</>;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  const data = query.data;
  const emptyNow =
    data === null ||
    data === undefined ||
    (Array.isArray(data) && data.length === 0) ||
    (isEmpty?.(data) ?? false);
  if (emptyNow)
    return (
      <>
        {empty ?? (
          <EmptyState
            title="No data for this district"
            description="Data sources for the selected district have not produced any records yet. Switch district or check Data Sources."
          />
        )}
      </>
    );
  return <>{children(data as NonNullable<T>)}</>;
}

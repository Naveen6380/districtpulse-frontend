import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/dp/states";
import { Button } from "@/components/ui/button";
import { canAccess, useSession } from "@/lib/auth";
import { useDistrict } from "@/lib/district";
import { get, USE_MOCK_API } from "@/services/api/client";
import { fmtDateTime } from "@/lib/format";

interface PipelineStatus {
  collected: number;
  pending: number;
  failed: number;
  processed: number;
  provider: {
    status: string;
    model: string;
    reasonCode?: string;
    requestLimit?: number;
    retryAt?: string;
  };
}
export function IncidentEmptyState() {
  const { districtId } = useDistrict();
  const session = useSession();
  const lead = canAccess(session?.user.role, ["collector", "administrator"]);
  const query = useQuery({
    queryKey: ["news-status", districtId],
    queryFn: () => get<PipelineStatus>(`/districts/${districtId}/news/status`),
    enabled: lead && !USE_MOCK_API,
    refetchInterval: 15000,
  });
  const status = query.data;
  const blocked = status?.provider.status === "blocked";
  return (
    <EmptyState
      title={lead ? "No incidents extracted yet" : "No incidents assigned to your department"}
      description={
        <>
          <span className="block">
            {lead
              ? "The incident register is empty. Collected articles must be processed and grouped before incidents appear."
              : "New incidents will appear here after your department is assigned."}
          </span>
          {status && (
            <span className="mt-2 block">
              News collected: {status.collected} · Processed: {status.processed} · Pending:{" "}
              {status.pending} · Failed: {status.failed}
            </span>
          )}
          {blocked && (
            <span className="mt-2 block text-destructive">
              {status.provider.reasonCode === "DAILY_QUOTA_EXHAUSTED"
                ? `AI paused: daily quota exhausted${status.provider.requestLimit ? ` (${status.provider.requestLimit} requests for this model)` : ""}.`
                : "AI paused: provider rate limit reached."}
              {status.provider.retryAt
                ? ` Provider retry time: ${fmtDateTime(status.provider.retryAt)} IST.`
                : ""}
            </span>
          )}
          {query.isError && (
            <span className="mt-2 block">
              Pipeline status could not be loaded. Check News Intelligence for source and processing
              errors.
            </span>
          )}
        </>
      }
      action={
        lead ? (
          <Button variant="outline" size="sm" asChild>
            <Link to="/news">Open News Intelligence</Link>
          </Button>
        ) : undefined
      }
    />
  );
}

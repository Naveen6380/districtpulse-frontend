import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SectionCard } from "@/components/dp/primitives";
import { Button } from "@/components/ui/button";
import { get, post, USE_MOCK_API } from "@/services/api/client";
import { fmtDate, fmtDateTime } from "@/lib/format";

interface Counts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}
interface LmsReference {
  status: string;
  sourceUrl: string;
  sourceDistrict?: string;
  sourceState?: string;
  referenceDate?: string;
  fetchedAt?: string;
  totals?: Counts;
  byCadre?: ({ cadre: string } & Counts)[];
  limitations?: string[];
}

export function LmsReferencePanel() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["lms-reference"],
    queryFn: () => get<LmsReference>("/integrations/lms"),
    enabled: !USE_MOCK_API,
  });
  const sync = useMutation({
    mutationFn: () => post<LmsReference>("/integrations/lms/sync"),
    onSuccess: (data) => {
      qc.setQueryData(["lms-reference"], data);
      toast.success("External LMS demo reference refreshed; Pudukkottai data unchanged");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (USE_MOCK_API) return null;
  const data = query.data;
  return (
    <SectionCard
      className="mt-4"
      title="Provided LMS · external reference"
      description="Yadadri Bhuvanagiri, Telangana · static demo/prototype · excluded from Pudukkottai statistics"
      actions={
        <Button
          size="sm"
          variant="outline"
          disabled={sync.isPending || query.isPending}
          onClick={() => sync.mutate()}
        >
          {sync.isPending ? "Reading reference…" : "Sync reference snapshot"}
        </Button>
      }
    >
      <p className="text-sm text-muted-foreground">
        This challenge portal publishes a fixed demo dataset. It has employee, reporting-manager and
        establishment/admin profiles; it does not provide a live server API in the inspected page.
      </p>
      <a
        className="mt-2 inline-block text-xs text-primary underline"
        href={data?.sourceUrl ?? "https://staging.d1ilryfopwulnt.amplifyapp.com/"}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open provided LMS
      </a>
      {query.isError && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {query.error.message}
        </p>
      )}
      {data?.referenceDate && (
        <p className="mt-3 text-xs text-muted-foreground">
          Source reference date: {fmtDate(data.referenceDate)} · Fetched:{" "}
          {fmtDateTime(data.fetchedAt)}. Fetch time does not mean the data is current.
        </p>
      )}
      {data?.totals ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(["total", "pending", "approved", "rejected", "cancelled"] as const).map((key) => (
              <div key={key} className="rounded-lg border bg-card p-3">
                <dt className="eyebrow">{key}</dt>
                <dd className="mt-1 text-2xl font-semibold">{data.totals![key]}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {["Source cadre", "Total", "Pending", "Approved", "Rejected", "Cancelled"].map(
                    (label) => (
                      <th key={label} className="border-b p-2">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {data.byCadre?.map((row) => (
                  <tr key={row.cadre}>
                    <td className="border-b p-2">{row.cadre}</td>
                    {(["total", "pending", "approved", "rejected", "cancelled"] as const).map(
                      (key) => (
                        <td key={key} className="border-b p-2">
                          {row[key]}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Only aggregates are retained. Names, employee IDs, contact details, medical reasons,
            attachments and individual requests are excluded.
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No reference snapshot saved yet. Use Sync reference snapshot to inspect the published demo
          aggregates.
        </p>
      )}
    </SectionCard>
  );
}

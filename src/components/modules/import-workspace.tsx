import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/dp/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDistrict } from "@/lib/district";
import { workspaceService, type ImportRecord } from "@/services/workspace.service";
import { fmtDateTime } from "@/lib/format";
import { useSession } from "@/lib/auth";
import { post } from "@/services/api/client";

function download(data: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ImportWorkspace() {
  const { districtId, district } = useDistrict();
  return <Workspace key={districtId} districtId={districtId} name={district?.name ?? districtId} />;
}
function Workspace({ districtId, name }: { districtId: string; name: string }) {
  const session = useSession();
  const qc = useQueryClient();
  const [url, setUrl] = useState("");
  const [related, setRelated] = useState(false);
  const [render, setRender] = useState(false);
  const capabilities = useQuery({
    queryKey: ["import-capabilities", districtId],
    queryFn: () =>
      import("@/services/api/client").then(({ get }) =>
        get<{ browserRendering: boolean }>(`/districts/${districtId}/imports/capabilities`),
      ),
  });
  const [authorised, setAuthorised] = useState(false);
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [after, setAfter] = useState("");
  const history = useQuery({
    queryKey: ["imports", districtId],
    queryFn: () => workspaceService.list(districtId),
    refetchInterval: (q) =>
      q.state.data?.some((r) => ["queued", "processing"].includes(r.status)) ? 2000 : false,
  });
  const detail = useQuery({
    queryKey: ["import", districtId, selected],
    queryFn: () => workspaceService.detail(districtId, selected),
    enabled: !!selected,
    refetchInterval: (q) =>
      q.state.data && ["queued", "processing"].includes(q.state.data.status) ? 1500 : false,
  });
  const create = useMutation({
    mutationFn: () => workspaceService.create(districtId, url, related, render),
    onSuccess: (r) => {
      setSelected(r.id);
      setSearch("");
      setAfter("");
      qc.setQueryData(["import", districtId, r.id], r);
      void qc.invalidateQueries({ queryKey: ["imports", districtId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const approve = useMutation({
    mutationFn: () => post(`/districts/${districtId}/imports/approve-host`, { url }),
    onSuccess: () => {
      toast.success("Hostname approved. Process the URL to import its content.");
      create.reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const refresh = useMutation({
    mutationFn: () => workspaceService.refresh(districtId, selected),
    onSuccess: (r) => {
      setSelected(r.id);
      setSearch("");
      setAfter("");
      qc.setQueryData(["import", districtId, r.id], r);
      void qc.invalidateQueries({ queryKey: ["imports", districtId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => workspaceService.remove(districtId, selected),
    onSuccess: () => {
      setSelected("");
      void qc.invalidateQueries({ queryKey: ["imports", districtId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const record = detail.data;
  const pages = record?.pages?.filter(
    (p) =>
      (!search ||
        `${p.title} ${p.text} ${p.tables.flatMap((t) => t.rows.flat()).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (!after ||
        (!!p.publishedAt &&
          Number.isFinite(Date.parse(p.publishedAt)) &&
          Date.parse(p.publishedAt) >= Date.parse(after))),
  );
  function ask(record: ImportRecord) {
    window.dispatchEvent(
      new CustomEvent("districtpulse:ask", {
        detail: {
          importId: record.id,
          question: "Summarise the information in this imported source.",
        },
      }),
    );
  }
  return (
    <>
      <PageHeader
        title="Import URL"
        description={`Paste a public link to see its information here. Saved in your ${name} workspace; links can be from any district.`}
      />
      <SectionCard title="New import">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Label htmlFor="import-url">Public source URL</Label>
          <Input
            id="import-url"
            type="url"
            required
            maxLength={2000}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://district.nic.in/document-or-page"
          />
          <details className="rounded border p-3 text-sm">
            <summary className="cursor-pointer font-medium">More import options</summary>
            <div className="mt-3 flex flex-wrap gap-5 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={render}
                  disabled={!capabilities.data?.browserRendering}
                  onChange={(e) => setRender(e.target.checked)}
                />
                Render JavaScript page
                {capabilities.data?.browserRendering ? "" : " (server not configured)"}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={related}
                  onChange={(e) => setRelated(e.target.checked)}
                />
                Include related pages on the same website (up to 5 pages)
              </label>
            </div>
          </details>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={authorised}
              onChange={(e) => setAuthorised(e.target.checked)}
            />
            I am authorised to import this source
          </label>
          <div>
            <Button disabled={!authorised || create.isPending}>
              {create.isPending ? "Submitting…" : "Process URL"}
            </Button>
          </div>
        </form>
        {(create.error || approve.error) && (
          <p
            role="alert"
            className="mt-3 rounded border border-destructive/30 p-3 text-sm text-destructive"
          >
            {approve.error?.message ?? create.error?.message}
          </p>
        )}
        {create.error?.message.includes("Host is not approved") &&
          session?.user.role === "administrator" && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-sm">Approve this source hostname for server-side imports?</p>
              <Button
                variant="outline"
                disabled={approve.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Approve the public hostname ${new URL(url).hostname} for imports?`,
                    )
                  )
                    approve.mutate();
                }}
              >
                Approve hostname
              </Button>
            </div>
          )}
        <p className="mt-3 text-xs text-muted-foreground">
          Information appears below automatically when processing finishes. Public pages, text
          documents and tables are supported.
        </p>
      </SectionCard>
      <div className="mt-4 grid gap-4 xl:grid-cols-[300px_1fr]">
        <div className="order-2 xl:order-1">
          <SectionCard title="Saved sources">
            {history.isLoading && <p role="status">Loading imports…</p>}
            {history.error && <p role="alert">{history.error.message}</p>}
            {!history.isLoading && !history.data?.length && (
              <p className="text-sm text-muted-foreground">No imports for this district.</p>
            )}
            <ul className="max-h-[600px] divide-y overflow-auto">
              {history.data?.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    aria-pressed={selected === r.id}
                    onClick={() => {
                      setSelected(r.id);
                      setSearch("");
                      setAfter("");
                    }}
                    className={`w-full rounded p-3 text-left text-sm hover:bg-muted ${selected === r.id ? "bg-muted" : ""}`}
                  >
                    <span className="block break-words font-medium">{r.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.status} · {fmtDateTime(r.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
        <div className="order-1 xl:order-2 min-w-0">
          <SectionCard title="Imported information">
            {!selected && (
              <p className="text-sm text-muted-foreground">
                Paste a link above and press Process URL. Its readable information will appear here.
              </p>
            )}
            {detail.isLoading && <p role="status">Loading source…</p>}
            {detail.error && <p role="alert">{detail.error.message}</p>}
            {record && (
              <>
                {["queued", "processing"].includes(record.status) && (
                  <div role="status" className="my-3 rounded-lg bg-muted p-4">
                    <p className="font-medium animate-pulse">Reading your source…</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We are collecting its readable information. This view updates automatically.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="mr-auto">
                    {record.status === "completed"
                      ? "Ready"
                      : record.status === "partial"
                        ? "Some information is ready"
                        : record.status === "failed"
                          ? "Could not read this source"
                          : "Processing"}{" "}
                    · {record.pages?.length ?? 0} pages
                  </strong>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => ask(record)}
                    disabled={!record.pages?.length}
                  >
                    Ask about this source
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={refresh.isPending}
                    onClick={() => refresh.mutate()}
                  >
                    Refresh source
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => download(record, `${record.id}.json`)}
                  >
                    Download JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={["queued", "processing"].includes(record.status) || remove.isPending}
                    onClick={() => {
                      if (window.confirm("Delete this saved import?")) remove.mutate();
                    }}
                  >
                    Delete import
                  </Button>
                </div>
                <div className="my-4 flex flex-wrap gap-3">
                  <Input
                    className="max-w-sm"
                    aria-label="Search imported data"
                    placeholder="Search source text and tables…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <label className="text-xs text-muted-foreground">
                    Published on or after
                    <Input
                      type="date"
                      aria-label="Source publication date from"
                      value={after}
                      onChange={(e) => setAfter(e.target.value)}
                    />
                  </label>
                </div>
                {record.issues?.map((issue, i) => (
                  <p key={i} role="status" className="my-2 text-sm text-destructive">
                    {issue}
                  </p>
                ))}
                {pages?.map((p, i) => (
                  <article key={p.url + i} className="mb-6 border-t pt-4">
                    <h3 className="font-semibold">{p.title}</h3>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-sm text-primary underline"
                    >
                      Original source
                    </a>
                    <p className="my-2 text-xs text-muted-foreground">
                      Published: {p.publishedAt || "Not stated by source"} · Collected:{" "}
                      {fmtDateTime(p.collectedAt)}
                      {p.lastModified ? ` · Last modified: ${p.lastModified}` : ""}
                    </p>
                    {p.truncated && (
                      <p className="text-xs text-muted-foreground">
                        Text preview limited to 100,000 characters.
                      </p>
                    )}
                    {p.tables.map((table, t) => (
                      <div key={t} className="my-3 max-h-80 overflow-auto rounded border">
                        <table className="w-full text-left text-sm">
                          <caption className="p-2 text-left font-medium">
                            Source table {t + 1}
                          </caption>
                          <thead>
                            <tr>
                              {table.columns.map((col, c) => (
                                <th key={c} className="border-b bg-muted p-2">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows
                              .filter(
                                (r) =>
                                  !search ||
                                  r.join(" ").toLowerCase().includes(search.toLowerCase()),
                              )
                              .map((row, r) => (
                                <tr key={r}>
                                  {row.map((cell, c) => (
                                    <td className="border-b p-2" key={c}>
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                    <section
                      aria-label="Source content"
                      className="mt-4 rounded-lg bg-muted/30 p-4"
                    >
                      <h4 className="text-sm font-medium">Page information</h4>
                      <p className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm">
                        {p.text}
                      </p>
                    </section>
                    {!!p.links.length && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm">
                          Related links ({p.links.length})
                        </summary>
                        <ul className="max-h-48 overflow-auto text-sm">
                          {p.links.map((link, n) => (
                            <li key={n}>
                              <a
                                className="text-primary underline"
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {link.title || link.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </article>
                ))}
                {["completed", "partial"].includes(record.status) && !pages?.length && (
                  <p>
                    No pages match these filters. Pages without a publication date are excluded by
                    the date filter.
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch("");
                        setAfter("");
                      }}
                    >
                      Clear filters
                    </Button>
                  </p>
                )}
              </>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}

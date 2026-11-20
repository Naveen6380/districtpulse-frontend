import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, get, post, USE_MOCK_API } from "@/services/api/client";

export function PipelineControls() {
  const qc = useQueryClient();
  const [job, setJob] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(""),
    [source, setSource] = useState(""),
    [url, setUrl] = useState(""),
    [date, setDate] = useState("");
  const start = useMutation({
    mutationFn: (retry: boolean) => post<{ id: string }>(retry ? "/pipeline/retry" : "/pipeline"),
    onSuccess: (r) => {
      setJob(r.id);
      toast.success("News pipeline started");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const status = useQuery({
    queryKey: ["pipeline", job],
    queryFn: () => get<{ status: string; message?: string }>(`/pipeline/${job}`),
    enabled: !!job,
    refetchInterval: (q) =>
      ["completed", "failed", "partial"].includes(q.state.data?.status ?? "") ? false : 3000,
  });
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select a document");
      const data = new FormData();
      data.set("file", file);
      data.set("title", title);
      data.set("source", source);
      data.set("sourceUrl", url);
      data.set("publishedAt", new Date(date).toISOString());
      data.set("authorised", "true");
      return (
        await api.post<{ pipeline: { id: string } }>("/news/import", data, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      ).data;
    },
    onSuccess: (r) => {
      setJob(r.pipeline.id);
      setOpen(false);
      toast.success("Article imported and queued for processing");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (USE_MOCK_API) return null;
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={
            start.isPending ||
            (!!job && !["completed", "failed", "partial"].includes(status.data?.status ?? ""))
          }
          onClick={() => start.mutate(false)}
        >
          Collect & analyse
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={start.isPending}
          onClick={() => start.mutate(true)}
        >
          Retry failed
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Import article
        </Button>
        {job && (
          <Button size="sm" variant="ghost" onClick={() => void qc.invalidateQueries()}>
            {status.data?.status ?? "queued"} · Refresh data
          </Button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import authorised newspaper content</DialogTitle>
            <DialogDescription>
              Text/CSV/XLSX, text PDF, or newspaper images with server OCR configured. Only import
              content you have permission to process.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              upload.mutate();
            }}
          >
            <Label>
              Title
              <Input
                required
                maxLength={500}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Label>
            <Label>
              Newspaper / source
              <Input
                required
                maxLength={255}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </Label>
            <Label>
              Original source URL
              <Input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
            </Label>
            <Label>
              Publication date
              <Input
                required
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Label>
            <Input
              type="file"
              aria-label="Article file"
              required
              accept=".txt,.csv,.xlsx,.pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              By importing, you confirm this content is authorised for processing. Maximum 10MB;
              publication within 30 days.
            </p>
            <Button disabled={upload.isPending}>Import & process</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

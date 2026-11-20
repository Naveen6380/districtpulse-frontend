import { useState, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAction, useDepartments } from "@/lib/queries";
import { DEMO_TODAY, PRIORITY_LABEL } from "@/lib/format";
import type { Priority } from "@/types";

const PRIORITIES = Object.keys(PRIORITY_LABEL) as Priority[];

const schema = z.object({
  title: z.string().trim().min(5, "At least 5 characters").max(120, "At most 120 characters"),
  description: z.string().trim().max(1000, "At most 1000 characters"),
  departmentId: z.string().min(1, "Choose a department"),
  priority: z.enum(["critical", "high", "medium", "low"]),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a due date"),
  incidentId: z.string().trim().max(40).optional(),
});
type Values = z.infer<typeof schema>;

export function CreateActionDialog({
  trigger,
  defaults,
}: {
  trigger: ReactNode;
  defaults?: { title?: string; departmentId?: string; priority?: Priority; incidentId?: string };
}) {
  const [open, setOpen] = useState(false);
  const { data: depts = [] } = useDepartments();
  const create = useCreateAction();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: defaults?.title ?? "",
      description: "",
      departmentId: defaults?.departmentId ?? "",
      priority: defaults?.priority ?? "medium",
      dueDate: new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10),
      incidentId: defaults?.incidentId ?? "",
    },
  });
  const { register, handleSubmit, control, formState, reset } = form;

  const onSubmit = handleSubmit(async (v) => {
    const incidentId = v.incidentId?.trim();
    await create.mutateAsync({
      title: v.title,
      description: v.description,
      departmentId: v.departmentId,
      priority: v.priority,
      dueDate: v.dueDate,
      ...(incidentId ? { incidentId } : {}),
    });
    reset();
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New action item</DialogTitle>
          <DialogDescription>
            Assign a follow-up to a department. It appears in the Action Tracker.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="act-title">Title</Label>
            <Input id="act-title" {...register("title")} />
            {formState.errors.title && (
              <p className="text-xs text-destructive">{formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="act-desc">Description</Label>
            <Textarea id="act-desc" rows={3} {...register("description")} />
            {formState.errors.description && (
              <p className="text-xs text-destructive">{formState.errors.description.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Department">
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
                )}
              />
              {formState.errors.departmentId && (
                <p className="text-xs text-destructive">{formState.errors.departmentId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-label="Priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-due">Due date</Label>
              <Input id="act-due" type="date" {...register("dueDate")} />
              {formState.errors.dueDate && (
                <p className="text-xs text-destructive">{formState.errors.dueDate.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="act-inc">Linked incident (optional)</Label>
              <Input id="act-inc" placeholder="e.g. INC-1012" {...register("incidentId")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Create action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

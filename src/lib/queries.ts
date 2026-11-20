// React Query hooks wrapping the service layer. Components never import mock data directly.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ActionInput,
  ActionStatus,
  DashboardPreferences,
  DataSourceInput,
  VerificationStatus,
} from "@/types";
import { useDistrict } from "./district";
import { useSession } from "./auth";
import { dashboardService } from "@/services/dashboard.service";
import { newsService } from "@/services/news.service";
import { incidentService } from "@/services/incidents.service";
import { mapService } from "@/services/map.service";
import {
  agricultureService,
  departmentService,
  leaveService,
  weatherService,
} from "@/services/sectors.service";
import { actionService, preferencesService, sourceService } from "@/services/operations.service";

const useD = () => useDistrict().districtId;

export const useOverview = () => {
  const d = useD();
  return useQuery({
    queryKey: ["overview", d],
    queryFn: () => dashboardService.getOverview(d),
    refetchInterval: 15000,
  });
};
export const useNotifications = () => {
  const d = useD();
  return useQuery({
    queryKey: ["notifications", d],
    queryFn: () => dashboardService.getNotifications(d),
  });
};
export const useGlobalSearch = (q: string) => {
  const d = useD();
  return useQuery({
    queryKey: ["search", d, q],
    queryFn: () => dashboardService.search(d, q),
    enabled: q.trim().length > 1,
  });
};

export const useArticles = () => {
  const d = useD();
  return useQuery({
    queryKey: ["articles", d],
    queryFn: () => newsService.listArticles(d),
    refetchInterval: 15000,
  });
};
export const useClusters = () => {
  const d = useD();
  return useQuery({ queryKey: ["clusters", d], queryFn: () => newsService.listClusters(d) });
};
export const useNewsInsights = () => {
  const d = useD();
  return useQuery({ queryKey: ["insights", d], queryFn: () => newsService.getInsights(d) });
};
export const useSummaries = () => {
  const d = useD();
  return useQuery({ queryKey: ["summaries", d], queryFn: () => newsService.getSummaries(d) });
};

export const useIncidents = () => {
  const d = useD();
  return useQuery({
    queryKey: ["incidents", d],
    queryFn: () => incidentService.list(d),
    refetchInterval: 15000,
  });
};
export const useIncident = (id: string) =>
  useQuery({ queryKey: ["incident", id], queryFn: () => incidentService.get(id), retry: false });

function useInvalidateIntel() {
  const qc = useQueryClient();
  return () =>
    [
      "incidents",
      "incident",
      "overview",
      "map",
      "departments",
      "department",
      "summaries",
      "insights",
      "clusters",
      "notifications",
    ].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export const useSetVerification = () => {
  const inv = useInvalidateIntel();
  return useMutation({
    mutationFn: (v: { id: string; verification: VerificationStatus; note?: string }) =>
      incidentService.setVerification(v.id, v.verification, v.note),
    onSuccess: () => {
      inv();
      toast.success("Verification status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
export const useAssignDepartment = () => {
  const inv = useInvalidateIntel();
  return useMutation({
    mutationFn: (v: { id: string; departmentId: string }) =>
      incidentService.assignDepartment(v.id, v.departmentId),
    onSuccess: () => {
      inv();
      toast.success("Department assignment updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useMapData = () => {
  const d = useD();
  return useQuery({ queryKey: ["map", d], queryFn: () => mapService.getMapData(d) });
};
export const useWeather = () => {
  const d = useD();
  return useQuery({
    queryKey: ["weather", d],
    queryFn: () => weatherService.getOverview(d),
    staleTime: 300000,
    refetchInterval: 900000,
    retry: 1,
  });
};
export const useAgriculture = () => {
  const d = useD();
  return useQuery({
    queryKey: ["agriculture", d],
    queryFn: () => agricultureService.getOverview(d),
    refetchInterval: 300000,
  });
};
export const useLeave = () => {
  const d = useD();
  return useQuery({ queryKey: ["leave", d], queryFn: () => leaveService.getOverview(d) });
};
export const useDepartments = () => {
  const d = useD();
  return useQuery({ queryKey: ["departments", d], queryFn: () => departmentService.list(d) });
};
export const useDepartment = (id: string) => {
  const d = useD();
  return useQuery({
    queryKey: ["department", d, id],
    queryFn: () => departmentService.get(d, id),
    retry: false,
  });
};

export const useActions = () => {
  const d = useD();
  return useQuery({ queryKey: ["actions", d], queryFn: () => actionService.list(d) });
};
function useInvalidateActions() {
  const qc = useQueryClient();
  return () =>
    ["actions", "overview", "departments", "department", "notifications"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
}
export const useCreateAction = () => {
  const inv = useInvalidateActions();
  return useMutation({
    mutationFn: (input: ActionInput) => actionService.create(input),
    onSuccess: (a) => {
      inv();
      toast.success(`Action ${a.id} created`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
export const useUpdateAction = () => {
  const inv = useInvalidateActions();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<ActionInput> & { status?: ActionStatus } }) =>
      actionService.update(v.id, v.patch),
    onSuccess: () => inv(),
    onError: (e: Error) => toast.error(e.message),
  });
};
export const useAddComment = () => {
  const inv = useInvalidateActions();
  const session = useSession();
  return useMutation({
    mutationFn: (v: { id: string; text: string }) =>
      actionService.addComment(v.id, session?.user.name ?? "User", v.text),
    onSuccess: () => {
      inv();
      toast.success("Comment added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSources = () =>
  useQuery({ queryKey: ["sources"], queryFn: () => sourceService.list() });
export const useSyncLogs = (id: string | null) =>
  useQuery({
    queryKey: ["syncLogs", id],
    queryFn: () => sourceService.getLogs(id!),
    enabled: !!id,
  });
function useInvalidateSources() {
  const qc = useQueryClient();
  return () =>
    ["sources", "syncLogs", "overview"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}
export const useSaveSource = () => {
  const inv = useInvalidateSources();
  return useMutation({
    mutationFn: (v: { id?: string; input: DataSourceInput }) =>
      v.id ? sourceService.update(v.id, v.input) : sourceService.create(v.input),
    onSuccess: (s) => {
      inv();
      toast.success(`Source "${s.name}" saved`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
export const useToggleSource = () => {
  const inv = useInvalidateSources();
  return useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => sourceService.setEnabled(v.id, v.enabled),
    onSuccess: (s) => {
      inv();
      toast.success(s.status === "disabled" ? `"${s.name}" disabled` : `"${s.name}" enabled`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
export const useTriggerSync = () => {
  const inv = useInvalidateSources();
  return useMutation({
    mutationFn: (id: string) => sourceService.triggerSync(id),
    onSuccess: (log) => {
      inv();
      if (log.status === "success") toast.success(log.message);
      else toast.warning(log.message);
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const usePreferences = () => {
  const session = useSession();
  const uid = session?.user.id ?? "anon";
  return useQuery({ queryKey: ["prefs", uid], queryFn: () => preferencesService.get(uid) });
};
export const useSavePreferences = () => {
  const qc = useQueryClient();
  const session = useSession();
  const uid = session?.user.id ?? "anon";
  return useMutation({
    mutationFn: (p: DashboardPreferences) => preferencesService.save(uid, p),
    onSuccess: (p) => {
      qc.setQueryData(["prefs", uid], p);
      toast.success("Dashboard layout saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
export const useResetPreferences = () => {
  const qc = useQueryClient();
  const session = useSession();
  const uid = session?.user.id ?? "anon";
  return useMutation({
    mutationFn: () => preferencesService.reset(uid),
    onSuccess: (p) => {
      qc.setQueryData(["prefs", uid], p);
      toast.success("Dashboard reset to default layout");
    },
  });
};

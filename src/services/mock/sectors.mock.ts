// MOCK weather, agriculture, leave and department services (demo data only).
import type {
  ActionItem,
  AgricultureOverview,
  Department,
  DepartmentStats,
  Incident,
  LeaveOverview,
  WeatherOverview,
} from "@/types";
import { departmentStats } from "./analytics";
import { DEPARTMENTS } from "./data/reference";
import { buildAgriculture, buildLeave, buildWeather } from "./data/sectors";
import { clone, forDistrict, latency, mockDb } from "./store";

export const mockWeatherService = {
  async getOverview(districtId: string): Promise<WeatherOverview | null> {
    await latency();
    return forDistrict(districtId, buildWeather(), null);
  },
};

export const mockAgricultureService = {
  async getOverview(districtId: string): Promise<AgricultureOverview | null> {
    await latency();
    return forDistrict(districtId, buildAgriculture(), null);
  },
};

export const mockLeaveService = {
  async getOverview(districtId: string): Promise<LeaveOverview | null> {
    await latency();
    return forDistrict(districtId, buildLeave(), null);
  },
};

export const mockDepartmentService = {
  async list(districtId: string): Promise<DepartmentStats[]> {
    await latency();
    const db = mockDb();
    return forDistrict(districtId, departmentStats(db.incidents, db.actions), []);
  },
  async get(
    districtId: string,
    id: string,
  ): Promise<{
    department: Department;
    stats: DepartmentStats;
    incidents: Incident[];
    actions: ActionItem[];
  }> {
    await latency();
    const department = DEPARTMENTS.find((d) => d.id === id);
    if (!department) throw new Error(`Department ${id} not found`);
    const db = mockDb();
    const stats = departmentStats(db.incidents, db.actions).find((s) => s.departmentId === id)!;
    const value = clone({
      department,
      stats,
      incidents: db.incidents.filter((i) => i.departmentId === id),
      actions: db.actions.filter((a) => a.departmentId === id),
    });
    return forDistrict(districtId, value, {
      department,
      stats: {
        ...stats,
        activeIncidents: 0,
        pendingActions: 0,
        completedActions: 0,
        highPriority: 0,
        critical: 0,
        latestUpdate: undefined,
      },
      incidents: [],
      actions: [],
    });
  },
};

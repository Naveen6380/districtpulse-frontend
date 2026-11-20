// Weather, Agriculture, Leave and Department services.
import type {
  ActionItem,
  AgricultureOverview,
  Department,
  DepartmentStats,
  Incident,
  LeaveOverview,
  WeatherOverview,
} from "@/types";
import { get, USE_MOCK_API } from "./api/client";
import {
  mockAgricultureService,
  mockDepartmentService,
  mockLeaveService,
  mockWeatherService,
} from "./mock/sectors.mock";

// GET /districts/{id}/weather       -> WeatherOverview   (IMD adapter)
const httpWeather = {
  getOverview: (d: string) =>
    get<WeatherOverview | null>(`/districts/${d}/weather`).then((v) => v || null),
};
// GET /districts/{id}/agriculture   -> AgricultureOverview (AGMARKNET / AGRISNET adapters)
const httpAgri = {
  getOverview: (d: string) =>
    get<AgricultureOverview | null>(`/districts/${d}/agriculture`).then((v) => v || null),
};
// GET /districts/{id}/leave/summary -> LeaveOverview (aggregated only, no personal data)
const httpLeave = {
  getOverview: (d: string) =>
    get<LeaveOverview | null>(`/districts/${d}/leave/summary`).then((v) => v || null),
};
// GET /districts/{id}/departments, GET /districts/{id}/departments/{deptId}
const httpDept = {
  list: (d: string) => get<DepartmentStats[]>(`/districts/${d}/departments`),
  get: (d: string, id: string) =>
    get<{
      department: Department;
      stats: DepartmentStats;
      incidents: Incident[];
      actions: ActionItem[];
    }>(`/districts/${d}/departments/${id}`),
};

export const weatherService = USE_MOCK_API ? mockWeatherService : httpWeather;
export const agricultureService = USE_MOCK_API ? mockAgricultureService : httpAgri;
export const leaveService = USE_MOCK_API ? mockLeaveService : httpLeave;
export const departmentService = USE_MOCK_API ? mockDepartmentService : httpDept;

import type { Incident } from "@/types";
import { get, USE_MOCK_API } from "./api/client";
import { mockMapService, type MapOverlay } from "./mock/intel.mock";

export type { MapOverlay };

// GET /districts/{id}/map   -> { incidents, overlays }
const http = {
  getMapData: (d: string) =>
    get<{ incidents: Incident[]; overlays: MapOverlay[] }>(`/districts/${d}/map`),
};

export const mapService = USE_MOCK_API ? mockMapService : http;

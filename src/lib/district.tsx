import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { District } from "@/types";
import { configService } from "@/services/dashboard.service";

const KEY = "dp.district";
const DEFAULT_DISTRICT =
  import.meta.env["VITE_USE_MOCK_API"] === "true"
    ? "vellanadu-demo"
    : (import.meta.env["VITE_DISTRICT_ID"] ?? "pudukkottai");

interface DistrictCtx {
  districtId: string;
  district?: District | undefined;
  districts: District[];
  setDistrictId: (id: string) => void;
}

const Ctx = createContext<DistrictCtx | null>(null);

export function DistrictProvider({ children }: { children: ReactNode }) {
  const [districtId, setId] = useState(DEFAULT_DISTRICT);
  const { data: districts = [] } = useQuery({
    queryKey: ["districts"],
    queryFn: () => configService.getDistricts(),
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    if (stored && districts.some((d) => d.id === stored)) setId(stored);
    else if (districts.length && !districts.some((d) => d.id === districtId))
      setId(districts[0]!.id);
  }, [districts, districtId]);

  const setDistrictId = (id: string) => {
    if (!districts.some((district) => district.id === id)) return;
    setId(id);
    window.localStorage.setItem(KEY, id);
  };

  return (
    <Ctx.Provider
      value={{
        districtId,
        district: districts.find((d) => d.id === districtId),
        districts,
        setDistrictId,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useDistrict() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDistrict must be used within DistrictProvider");
  return ctx;
}

import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, CloudRain, Sprout, CalendarCheck } from "lucide-react";
import {
  PageHeader,
  SectionCard,
  KpiCard,
  FilterBar,
  SearchInput,
} from "@/components/dp/primitives";
import { QueryView, EmptyState } from "@/components/dp/states";
import { LmsReferencePanel } from "./lms-reference";
import { Button } from "@/components/ui/button";
import { useMapData, useWeather, useAgriculture, useLeave } from "@/lib/queries";
import { useDistrict } from "@/lib/district";
import { get, USE_MOCK_API } from "@/services/api/client";
import { fmtDate, fmtDateTime } from "@/lib/format";
import type { Incident } from "@/types";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export function MapPage() {
  const { district } = useDistrict();
  const query = useMapData();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  return (
    <>
      <PageHeader
        title="Map Intelligence"
        description={`${district?.name ?? "Selected district"} · Verified incident coordinates only. Pan and zoom to explore.`}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} />
        <select
          aria-label="Map priority"
          className="h-9 rounded-md border bg-card px-3 text-sm"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {["all", "critical", "high", "medium", "low"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </FilterBar>
      <QueryView query={query} isEmpty={() => false}>
        {(data) => {
          const rows = data.incidents.filter(
            (i) =>
              (priority === "all" || i.priority === priority) &&
              (i.title + " " + i.location.name).toLowerCase().includes(search.toLowerCase()),
          );
          return (
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <SectionCard title="Incident locations">
                <DistrictMap incidents={rows} />
                <p className="mt-2 text-xs text-muted-foreground">
                  Map attribution: OpenStreetMap contributors. Locations are not geocoded or guessed
                  automatically.
                </p>
              </SectionCard>
              <SectionCard
                title={`Unresolved locations (${rows.filter((i) => !i.location.resolved).length})`}
              >
                <ul className="max-h-[520px] divide-y overflow-auto">
                  {rows
                    .filter((i) => !i.location.resolved)
                    .map((i) => (
                      <li key={i.id} className="py-3">
                        <Link
                          to="/incidents/$incidentId"
                          params={{ incidentId: i.id }}
                          className="text-sm font-medium hover:underline"
                        >
                          {i.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {i.location.name} · {i.priority}
                        </p>
                      </li>
                    ))}
                </ul>
                {!rows.length && <EmptyState title="No matching incidents" />}
              </SectionCard>
            </div>
          );
        }}
      </QueryView>
    </>
  );
}
function DistrictMap({ incidents }: { incidents: Incident[] }) {
  const { districtId, district } = useDistrict();
  const latitude = district?.geography?.latitude;
  const longitude = district?.geography?.longitude;
  const zoom = district?.geography?.zoom ?? 10;
  const container = useRef<HTMLDivElement>(null);
  const activeMap = useRef<import("leaflet").Map | null>(null);
  const view = useRef<{ district: string; center: import("leaflet").LatLng; zoom: number } | null>(
    null,
  );
  useEffect(() => {
    if (latitude === undefined || longitude === undefined) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    (async () => {
      const leaflet = await import("leaflet");
      // The plugin extends Leaflet's mutable default export, not the ES-module namespace.
      const L = leaflet.default;
      await import("leaflet.markercluster");
      if (cancelled || !container.current) return;
      const previous = view.current?.district === districtId ? view.current : null;
      map = L.map(container.current, {
        center: previous?.center ?? [latitude, longitude],
        zoom: previous?.zoom ?? zoom,
      });
      activeMap.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const cluster = L.markerClusterGroup();
      incidents
        .filter(
          (i) =>
            i.location.resolved &&
            Number.isFinite(i.location.lat) &&
            Number.isFinite(i.location.lng),
        )
        .forEach((i) => {
          const point: [number, number] = [i.location.lat!, i.location.lng!];
          const text = document.createElement("span");
          text.textContent = `${i.title} — ${i.priority}`;
          cluster.addLayer(
            L.marker(point, {
              icon: L.divIcon({
                className: "",
                html: '<span style="display:block;width:14px;height:14px;border-radius:50%;background:#1e40af;border:2px solid white"></span>',
                iconSize: [14, 14],
              }),
            }).bindPopup(text),
          );
        });
      cluster.addTo(map);
    })();
    return () => {
      cancelled = true;
      if (map)
        view.current = { district: districtId, center: map.getCenter(), zoom: map.getZoom() };
      map?.remove();
      activeMap.current = null;
    };
  }, [incidents, districtId, latitude, longitude, zoom]);
  if (latitude === undefined || longitude === undefined)
    return <EmptyState title="District map location is not configured" />;
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="mb-2"
        onClick={() => activeMap.current?.setView([latitude, longitude], zoom)}
      >
        Reset to {district?.name ?? "district"}
      </Button>
      <div
        ref={container}
        className="h-[500px] rounded-lg bg-muted"
        aria-label="District incident map"
      />
    </>
  );
}

function DatasetImport({ kind }: { kind: "weather" | "agriculture" | "leave" }) {
  const { districtId } = useDistrict();
  const meta = useQuery({
    queryKey: ["provenance", districtId, kind],
    queryFn: () =>
      get<{ status: string; sourceUrl?: string; observedAt?: string; collectedAt?: string }>(
        `/districts/${districtId}/datasets/${kind}/provenance`,
      ),
    enabled: !USE_MOCK_API,
  });
  return (
    <SectionCard title="Source and freshness" className="mt-4">
      <p className="text-sm text-muted-foreground">
        Status: {USE_MOCK_API ? "Demo data" : (meta.data?.status ?? "Checking")}
        {meta.data?.observedAt ? ` · Observed ${fmtDateTime(meta.data.observedAt)}` : ""}
      </p>
      {meta.data?.sourceUrl && (
        <a
          className="text-xs text-primary underline"
          href={meta.data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Original source
        </a>
      )}
    </SectionCard>
  );
}
function Table({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {columns.map((c) => (
              <th className="border-b p-2" key={c}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, n) => (
            <tr key={n}>
              {r.map((v, k) => (
                <td className="border-b p-2" key={k}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="py-4 text-xs text-muted-foreground">No records in the imported dataset.</p>
      )}
    </div>
  );
}
export function WeatherPage() {
  const q = useWeather();
  const { district } = useDistrict();
  return (
    <>
      <PageHeader
        title="Weather Intelligence"
        description={`${district?.name ?? "Selected district"} · Source-attributed current conditions and forecast.`}
      />
      <QueryView
        query={q}
        empty={
          <EmptyState
            title="Weather source not connected"
            description="Live forecast is unavailable or disabled. An authorised weather export can also be imported."
          />
        }
      >
        {(w) => (
          <div className="space-y-4">
            {w.provider && (
              <p className="text-sm text-muted-foreground">
                <a
                  href={w.provider.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {w.provider.name}
                </a>
                {` · ${w.freshness === "stale" ? "Stale cached forecast" : "Model forecast"} · Updated ${fmtDateTime(w.current.observedAt)}`}
                <span className="block">{w.provider.note}</span>
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <KpiCard
                label="Temperature"
                value={`${w.current.tempC} °C`}
                icon={CloudRain}
                hint={w.current.condition}
              />
              <KpiCard label="Humidity" value={`${w.current.humidity}%`} icon={CloudRain} />
              <KpiCard label="Wind" value={`${w.current.windKmph} km/h`} icon={Activity} />
            </div>
            <SectionCard title="Weather warnings">
              {w.warnings
                .filter((a) => a.active)
                .map((a) => (
                  <article key={a.id} className="border-b py-3">
                    <h3 className="text-sm font-semibold">
                      {a.title} · {a.level}
                    </h3>
                    <p className="text-sm text-muted-foreground">{a.description}</p>
                    <p className="text-xs">
                      {a.areas.join(", ")} · {a.source} · Valid until {fmtDateTime(a.validUntil)}
                    </p>
                  </article>
                ))}
              {!w.warnings.some((a) => a.active) && (
                <EmptyState
                  title={
                    w.provider?.warningsConnected === false
                      ? "Official IMD warnings not connected"
                      : "No active warnings in this dataset"
                  }
                  description={
                    w.provider?.warningsConnected === false
                      ? "No warning data is available here; check IMD for official alerts."
                      : undefined
                  }
                />
              )}
            </SectionCard>
            <SectionCard title="Forecast">
              <Table
                columns={[
                  "Date",
                  "Conditions",
                  "Maximum °C",
                  "Minimum °C",
                  "Rain chance %",
                  "Forecast rain mm",
                ]}
                rows={w.forecast.map((d) => [
                  fmtDate(d.date),
                  d.condition,
                  d.maxC ?? "Unavailable",
                  d.minC ?? "Unavailable",
                  d.rainChance ?? "Unavailable",
                  d.rainMm ?? "Unavailable",
                ])}
              />
            </SectionCard>
            <SectionCard title="Recorded rainfall">
              <Table
                columns={["Date", "Actual mm", "Normal mm"]}
                rows={w.rainfall.map((d) => [fmtDate(d.date), d.actualMm, d.normalMm])}
              />
            </SectionCard>
          </div>
        )}
      </QueryView>
      <DatasetImport kind="weather" />
    </>
  );
}
export function AgriculturePage() {
  const q = useAgriculture();
  const { district } = useDistrict();
  return (
    <>
      <PageHeader
        title="Agriculture Intelligence"
        description={`${district?.name ?? "Selected district"} · Market prices, arrivals and scheme coverage from authorised district data.`}
      />
      <QueryView
        query={q}
        empty={
          <EmptyState
            title="Agriculture source not connected"
            description={`No connected market or scheme data for ${district?.name ?? "this district"}. Import an authorised AGMARKNET / AGRISNET export.`}
          />
        }
      >
        {(a) => (
          <div className="space-y-4">
            {a.provider && (
              <p className="text-sm text-muted-foreground">
                {a.provider.name} · {a.freshness ?? a.provider.status}
                {a.freshness?.includes("rate_limited") && (
                  <span className="block">
                    data.gov.in is rate-limiting requests. Automatic requests are paused for one
                    hour; existing cached records, if any, may be stale.
                  </span>
                )}
                {a.freshness === "not_configured" && (
                  <span className="block">
                    The data.gov.in API key has not been configured. Live prices have not been
                    fetched.
                  </span>
                )}
                {a.freshness === "fetch_failed" && (
                  <span className="block">
                    Price fetch failed. Check provider access and retry; no prices were fabricated.
                  </span>
                )}
                {a.freshness?.includes("access_denied") && (
                  <span className="block">data.gov.in refused access. Verify the configured API key and its permissions; requests are paused for five minutes.</span>
                )}
                {a.freshness === "no_records" && (
                  <span className="block">
                    The provider returned no matching valid price records for this district.
                  </span>
                )}
                <span className="block">{a.provider.note}</span>
              </p>
            )}
            <SectionCard title="Market prices">
              <Table
                columns={[
                  "Commodity",
                  "Variety",
                  "Market",
                  "Reported date",
                  "Minimum",
                  "Maximum",
                  "Modal price",
                  "Unit",
                  "Change %",
                ]}
                rows={a.latestPrices.map((p) => [
                  p.commodity,
                  p.variety ?? "Unavailable",
                  p.market,
                  p.date ? fmtDate(p.date) : "Unavailable",
                  p.minPrice ?? "Unavailable",
                  p.maxPrice ?? "Unavailable",
                  p.modalPrice,
                  p.unit,
                  p.changePct ?? "Unavailable",
                ])}
              />
            </SectionCard>
            <SectionCard title="Scheme coverage">
              <Table
                columns={["Scheme", "Target", "Covered"]}
                rows={a.schemes.map((s) => [s.scheme, s.target, s.covered])}
              />
            </SectionCard>
            <SectionCard title="Farmer-officer visits">
              <Table
                columns={["Block", "Visits", "Farmers reached"]}
                rows={a.visits.map((v) => [v.block, v.visits, v.farmersReached])}
              />
            </SectionCard>
            <SectionCard title="Village coverage">
              <Table
                columns={["Village", "Taluk", "Crop area", "Irrigated %", "Soil cards"]}
                rows={a.villages.map((v) => [
                  v.village,
                  v.taluk,
                  v.cropArea,
                  v.irrigatedPct,
                  v.soilCards,
                ])}
              />
            </SectionCard>
          </div>
        )}
      </QueryView>
      <DatasetImport kind="agriculture" />
    </>
  );
}
export function LeavePage() {
  const q = useLeave();
  return (
    <>
      <PageHeader
        title="Leave Management"
        description="Aggregated administrative summaries protect employee information."
      />
      <QueryView
        query={q}
        empty={
          <EmptyState
            title="No Pudukkottai leave dataset connected"
            description="The provided LMS covers Yadadri Bhuvanagiri. Its demo reference is kept separately below; authorised Pudukkottai aggregates can be imported here."
          />
        }
      >
        {(l) => (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              {(["total", "pending", "approved", "rejected"] as const).map((k) => (
                <KpiCard key={k} label={k} value={l.totals[k]} icon={CalendarCheck} />
              ))}
            </div>
            <SectionCard title="Department summaries">
              <Table
                columns={["Department", "Pending", "Approved", "Rejected"]}
                rows={l.byDepartment.map((d) => [d.department, d.pending, d.approved, d.rejected])}
              />
            </SectionCard>
            <SectionCard title="Monthly totals">
              <Table
                columns={["Month", "Approved", "Rejected", "Pending"]}
                rows={l.monthly.map((m) => [m.month, m.approved, m.rejected, m.pending])}
              />
            </SectionCard>
          </div>
        )}
      </QueryView>
      <DatasetImport kind="leave" />
      <LmsReferencePanel />
    </>
  );
}

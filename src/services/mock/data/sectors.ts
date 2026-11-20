// DEMO DATA — fictional weather, agriculture and leave datasets.
import type { AgricultureOverview, LeaveOverview, WeatherOverview } from "@/types";
import { DEPARTMENTS, demoDate, demoDay } from "./reference";

// 30 days of rainfall (oldest first). Values are fictional.
const RAIN = [
  0, 0, 2, 5, 12, 0, 3, 18, 26, 9, 0, 4, 7, 15, 31, 22, 6, 0, 11, 24, 38, 17, 8, 3, 14, 29, 46, 61,
  34, 19,
];
const NORMAL = [
  4, 4, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12, 12, 13, 13, 13,
  14, 14,
];

export function buildWeather(): WeatherOverview {
  return {
    current: {
      tempC: 26,
      humidity: 91,
      windKmph: 22,
      condition: "Overcast, moderate rain",
      observedAt: demoDate(0, 9, 0),
    },
    rainfall: RAIN.map((r, i) => ({
      date: demoDay(29 - i),
      actualMm: r,
      normalMm: NORMAL[i] ?? 0,
    })),
    warnings: [
      {
        id: "WW-01",
        type: "heavy_rain",
        level: "orange",
        title: "Heavy to very heavy rainfall",
        description:
          "Heavy to very heavy rainfall likely at isolated places over the next 48 hours.",
        areas: ["All taluks"],
        issuedAt: demoDate(1, 13),
        validUntil: demoDate(-1, 13),
        source: "IMD bulletin (demo)",
        active: true,
      },
      {
        id: "WW-02",
        type: "thunderstorm",
        level: "yellow",
        title: "Thunderstorm with lightning",
        description: "Thunderstorm with lightning and gusty winds (30–40 km/h) likely.",
        areas: ["Thenmalai", "Kalpatti"],
        issuedAt: demoDate(0, 6),
        validUntil: demoDate(-1, 6),
        source: "IMD nowcast (demo)",
        active: true,
      },
      {
        id: "WW-03",
        type: "flood",
        level: "orange",
        title: "Flood watch for river-adjoining villages",
        description: "Rising inflows; residents of low-lying villages advised caution.",
        areas: ["Vellanadu", "Arasur"],
        issuedAt: demoDate(2, 18),
        validUntil: demoDate(-2, 18),
        source: "WRD advisory (demo)",
        active: true,
      },
      {
        id: "WW-04",
        type: "cyclone",
        level: "yellow",
        title: "Low pressure area — cyclone watch",
        description:
          "Low pressure over the sea may intensify; no cyclone warning issued for the district at present.",
        areas: ["Coastal-adjacent region"],
        issuedAt: demoDate(0, 8),
        validUntil: demoDate(-3, 8),
        source: "IMD extended outlook (demo)",
        active: true,
      },
      {
        id: "WW-05",
        type: "heatwave",
        level: "green",
        title: "Heat advisory withdrawn",
        description:
          "Above-normal temperatures in early October; advisory withdrawn after monsoon onset.",
        areas: ["All taluks"],
        issuedAt: demoDate(29, 12),
        validUntil: demoDate(24, 12),
        source: "IMD bulletin (demo)",
        active: false,
      },
      {
        id: "WW-06",
        type: "thunderstorm",
        level: "yellow",
        title: "Thunderstorm warning",
        description: "Thunderstorms caused tree falls in Kalpatti.",
        areas: ["Kalpatti"],
        issuedAt: demoDate(20, 14),
        validUntil: demoDate(19, 14),
        source: "IMD nowcast (demo)",
        active: false,
      },
    ],
    monthly: [
      { month: "Jan", rainfallMm: 22, normalMm: 28, maxTempC: 30 },
      { month: "Feb", rainfallMm: 8, normalMm: 12, maxTempC: 32 },
      { month: "Mar", rainfallMm: 14, normalMm: 10, maxTempC: 35 },
      { month: "Apr", rainfallMm: 31, normalMm: 35, maxTempC: 37 },
      { month: "May", rainfallMm: 58, normalMm: 52, maxTempC: 38 },
      { month: "Jun", rainfallMm: 34, normalMm: 40, maxTempC: 36 },
      { month: "Jul", rainfallMm: 47, normalMm: 55, maxTempC: 35 },
      { month: "Aug", rainfallMm: 92, normalMm: 80, maxTempC: 34 },
      { month: "Sep", rainfallMm: 118, normalMm: 105, maxTempC: 34 },
      { month: "Oct", rainfallMm: 196, normalMm: 172, maxTempC: 32 },
    ],
    forecast: [
      { date: demoDay(0), condition: "Heavy rain", maxC: 28, minC: 23, rainChance: 90 },
      { date: demoDay(-1), condition: "Heavy rain", maxC: 28, minC: 23, rainChance: 85 },
      { date: demoDay(-2), condition: "Moderate rain", maxC: 29, minC: 24, rainChance: 70 },
      { date: demoDay(-3), condition: "Thunderstorm", maxC: 30, minC: 24, rainChance: 60 },
      { date: demoDay(-4), condition: "Cloudy", maxC: 31, minC: 24, rainChance: 35 },
    ],
  };
}

const WEEKS = ["W36", "W37", "W38", "W39", "W40", "W41", "W42", "W43", "W44"];
const PRICE: Record<string, number[]> = {
  Paddy: [2180, 2195, 2190, 2210, 2225, 2240, 2230, 2260, 2275],
  Banana: [1650, 1700, 1720, 1680, 1610, 1580, 1620, 1700, 1760],
  Turmeric: [11800, 12100, 12450, 12300, 12600, 12900, 13200, 13050, 13400],
  Onion: [2400, 2650, 2900, 3100, 3350, 3200, 3050, 3300, 3550],
  Coconut: [3100, 3150, 3120, 3180, 3220, 3260, 3240, 3300, 3320],
};
const ARR: Record<string, number[]> = {
  Paddy: [820, 860, 910, 980, 1040, 1150, 1240, 1180, 1320],
  Banana: [310, 290, 305, 320, 298, 280, 270, 300, 315],
  Turmeric: [95, 102, 98, 110, 105, 99, 94, 101, 108],
  Onion: [210, 190, 175, 160, 150, 165, 172, 158, 149],
  Coconut: [140, 138, 145, 150, 148, 152, 149, 155, 158],
};

export function buildAgriculture(): AgricultureOverview {
  const commodities = Object.keys(PRICE);
  const series = (src: Record<string, number[]>) =>
    WEEKS.map((week, i) => {
      const row: Record<string, number | string> = { week };
      commodities.forEach((c) => (row[c] = src[c]?.[i] ?? 0));
      return row as { week: string; [k: string]: number | string };
    });
  return {
    commodities,
    prices: series(PRICE),
    arrivals: series(ARR),
    latestPrices: [
      {
        commodity: "Paddy",
        market: "Vellanadu Regulated Market",
        modalPrice: 2275,
        unit: "₹/quintal",
        changePct: 0.7,
      },
      {
        commodity: "Banana",
        market: "Ponnagaram Market",
        modalPrice: 1760,
        unit: "₹/quintal",
        changePct: 3.5,
      },
      {
        commodity: "Turmeric",
        market: "Kalpatti Market",
        modalPrice: 13400,
        unit: "₹/quintal",
        changePct: 2.7,
      },
      {
        commodity: "Onion",
        market: "Vellanadu Regulated Market",
        modalPrice: 3550,
        unit: "₹/quintal",
        changePct: 7.6,
      },
      {
        commodity: "Coconut",
        market: "Arasur Market",
        modalPrice: 3320,
        unit: "₹/quintal",
        changePct: 0.6,
      },
    ],
    schemes: [
      { scheme: "PM-KISAN (demo figures)", target: 48000, covered: 41200 },
      { scheme: "Crop insurance enrolment", target: 32000, covered: 23800 },
      { scheme: "Soil health card", target: 25000, covered: 21900 },
      { scheme: "Micro-irrigation subsidy", target: 3200, covered: 1760 },
      { scheme: "Farm mechanisation", target: 1500, covered: 1010 },
    ],
    visits: [
      { block: "Vellanadu", visits: 142, farmersReached: 1180 },
      { block: "Kalpatti", visits: 118, farmersReached: 960 },
      { block: "Arasur", visits: 97, farmersReached: 820 },
      { block: "Ponnagaram", visits: 126, farmersReached: 1045 },
      { block: "Thenmalai", visits: 88, farmersReached: 690 },
    ],
    villages: [
      {
        village: "Kollidam Kadu",
        taluk: "Vellanadu",
        cropArea: 1240,
        irrigatedPct: 82,
        soilCards: 610,
      },
      { village: "Siruvalur", taluk: "Kalpatti", cropArea: 980, irrigatedPct: 64, soilCards: 455 },
      {
        village: "Annur Pudur",
        taluk: "Ponnagaram",
        cropArea: 1110,
        irrigatedPct: 71,
        soilCards: 530,
      },
      {
        village: "Vadakku Kulam",
        taluk: "Thenmalai",
        cropArea: 760,
        irrigatedPct: 58,
        soilCards: 340,
      },
      { village: "Karaiyur", taluk: "Arasur", cropArea: 890, irrigatedPct: 76, soilCards: 410 },
      { village: "Melpettai", taluk: "Arasur", cropArea: 640, irrigatedPct: 49, soilCards: 280 },
    ],
  };
}

export function buildLeave(): LeaveOverview {
  const byDepartment = DEPARTMENTS.map((d, i) => ({
    departmentId: d.id,
    department: d.shortName,
    pending: [6, 4, 3, 5, 9, 7, 3, 4, 2][i] ?? 0,
    approved: [38, 27, 19, 31, 52, 46, 22, 25, 16][i] ?? 0,
    rejected: [3, 2, 1, 2, 5, 4, 1, 2, 1][i] ?? 0,
  }));
  const pending = byDepartment.reduce((s, d) => s + d.pending, 0);
  const approved = byDepartment.reduce((s, d) => s + d.approved, 0);
  const rejected = byDepartment.reduce((s, d) => s + d.rejected, 0);
  const types = ["Casual leave", "Earned leave", "Medical leave", "Restricted holiday", "On duty"];
  // Sums to totals.total (340) so charts stay consistent.
  const typeCounts = [134, 96, 47, 41, 22];
  return {
    totals: { total: pending + approved + rejected, pending, approved, rejected },
    byDepartment,
    monthly: [
      { month: "Jun", approved: 41, rejected: 3, pending: 0 },
      { month: "Jul", approved: 46, rejected: 4, pending: 0 },
      { month: "Aug", approved: 52, rejected: 5, pending: 0 },
      { month: "Sep", approved: 49, rejected: 4, pending: 0 },
      { month: "Oct", approved: 58, rejected: 3, pending: 0 },
      { month: "Nov", approved: approved - 246, rejected: rejected - 19, pending },
    ],
    byType: types.map((type, i) => ({ type, count: typeCounts[i] ?? 0 })),
    recentRequests: Array.from({ length: 10 }, (_, i) => ({
      ref: `LR-${2410 - i}`,
      employeeRef: `EMP-••••${String(17 + i * 7).padStart(2, "0")}`,
      department: DEPARTMENTS[(i * 4) % DEPARTMENTS.length]!.shortName,
      type: types[i % types.length]!,
      days: [1, 3, 2, 5, 1, 2, 4, 1, 7, 2][i] ?? 1,
      status:
        (
          [
            "pending",
            "approved",
            "pending",
            "approved",
            "rejected",
            "approved",
            "pending",
            "approved",
            "approved",
            "pending",
          ] as const
        )[i] ?? "pending",
      appliedOn: demoDate(i, 10),
    })),
  };
}

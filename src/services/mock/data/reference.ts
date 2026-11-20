// DEMO DATA — entirely fictional reference data for demonstration only.
// "Vellanadu" is a fictional district. Coordinates are sample values for demo records.
import type { Department, District, GeoLocation, User } from "@/types";

/** All demo records are dated relative to this fixed reference date. */
export const DEMO_REFERENCE_DATE = "2026-11-06T09:30:00+05:30";
export const DEMO_DISTRICT_ID = "vellanadu-demo";

export function demoDate(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date("2026-11-06T00:00:00+05:30");
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() + hour, minute);
  return d.toISOString();
}

export function demoDay(daysAgo: number): string {
  // Calendar date (YYYY-MM-DD) in IST.
  const base = Date.UTC(2026, 10, 6) - daysAgo * 86400000;
  return new Date(base).toISOString().slice(0, 10);
}

export const DISTRICTS: District[] = [
  { id: "pudukkottai", name: "Pudukkottai", state: "Tamil Nadu", isDemo: false, hasData: true },
  { id: DEMO_DISTRICT_ID, name: "Vellanadu", state: "Demo State", isDemo: true, hasData: true },
  {
    id: "kaveripuram-demo",
    name: "Kaveripuram",
    state: "Demo State",
    isDemo: true,
    hasData: false,
  },
];

export const DEPARTMENTS: Department[] = [
  {
    id: "revenue",
    name: "Revenue & Disaster Management",
    shortName: "Revenue",
    headDesignation: "District Revenue Officer",
  },
  {
    id: "pwd",
    name: "Public Works Department",
    shortName: "PWD",
    headDesignation: "Executive Engineer (PWD)",
  },
  {
    id: "wrd",
    name: "Water Resources Department",
    shortName: "WRD",
    headDesignation: "Executive Engineer (WRD)",
  },
  {
    id: "agri",
    name: "Agriculture & Farmers Welfare",
    shortName: "Agriculture",
    headDesignation: "Joint Director of Agriculture",
  },
  {
    id: "health",
    name: "Health & Family Welfare",
    shortName: "Health",
    headDesignation: "Deputy Director of Health Services",
  },
  {
    id: "edu",
    name: "School Education",
    shortName: "Education",
    headDesignation: "Chief Educational Officer",
  },
  {
    id: "rural",
    name: "Rural Development & Panchayat Raj",
    shortName: "Rural Dev.",
    headDesignation: "Project Director, DRDA",
  },
  {
    id: "municipal",
    name: "Municipal Administration",
    shortName: "Municipal",
    headDesignation: "Municipal Commissioner",
  },
  {
    id: "power",
    name: "Electricity Distribution",
    shortName: "Electricity",
    headDesignation: "Superintending Engineer",
  },
];

export const LOCATIONS: Record<string, GeoLocation> = {
  L0: { name: "Vellanadu Town", taluk: "Vellanadu", lat: 10.812, lng: 78.692, resolved: true },
  L1: { name: "Kalpatti", taluk: "Kalpatti", lat: 10.905, lng: 78.585, resolved: true },
  L2: { name: "Arasur", taluk: "Arasur", lat: 10.742, lng: 78.861, resolved: true },
  L3: { name: "Ponnagaram", taluk: "Ponnagaram", lat: 10.678, lng: 78.735, resolved: true },
  L4: { name: "Thenmalai", taluk: "Thenmalai", lat: 10.958, lng: 78.812, resolved: true },
  L5: { name: "Kollidam Kadu", taluk: "Vellanadu", lat: 10.851, lng: 78.744, resolved: true },
  L6: { name: "Siruvalur", taluk: "Kalpatti", lat: 10.931, lng: 78.642, resolved: true },
  L7: { name: "Melpettai", taluk: "Arasur", lat: 10.775, lng: 78.902, resolved: true },
  L8: { name: "Annur Pudur", taluk: "Ponnagaram", lat: 10.701, lng: 78.672, resolved: true },
  L9: { name: "Vadakku Kulam", taluk: "Thenmalai", lat: 10.987, lng: 78.759, resolved: true },
  L10: { name: "Puthur Colony", taluk: "Vellanadu", lat: 10.826, lng: 78.668, resolved: true },
  L11: { name: "Karaiyur", taluk: "Arasur", lat: 10.718, lng: 78.824, resolved: true },
  U0: { name: "Near old canal bridge (unspecified)", taluk: "Unresolved", resolved: false },
  U1: { name: "Eastern villages (unspecified)", taluk: "Unresolved", resolved: false },
  U2: { name: "Bypass road stretch (unspecified)", taluk: "Unresolved", resolved: false },
};

export const TALUKS = ["Vellanadu", "Kalpatti", "Arasur", "Ponnagaram", "Thenmalai"];

export const NEWSPAPERS = [
  "Southern Herald",
  "Kaveri Times",
  "Regional Dispatch",
  "Morning Courier",
  "Tamil Vaani Daily",
  "District Observer",
];

/** Demo accounts. Passwords are never stored in the frontend; mock mode accepts any 8+ char password. */
export const DEMO_USERS: User[] = [
  {
    id: "u-collector",
    name: "Collector (Demo)",
    email: "collector@demo.districtpulse.in",
    role: "collector",
    designation: "District Collector",
  },
  {
    id: "u-admin",
    name: "System Administrator (Demo)",
    email: "admin@demo.districtpulse.in",
    role: "administrator",
    designation: "Platform Administrator",
  },
  {
    id: "u-officer",
    name: "Department Officer (Demo)",
    email: "officer@demo.districtpulse.in",
    role: "department_officer",
    designation: "Executive Engineer (PWD)",
    departmentId: "pwd",
  },
];

export const departmentName = (id: string) => DEPARTMENTS.find((d) => d.id === id)?.name ?? id;
export const departmentShort = (id: string) =>
  DEPARTMENTS.find((d) => d.id === id)?.shortName ?? id;

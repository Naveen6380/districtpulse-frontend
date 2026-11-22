// Shared domain types. These mirror the expected Spring Boot REST response DTOs.

export type Priority = "critical" | "high" | "medium" | "low";
export type Category =
  | "flood"
  | "weather"
  | "agriculture"
  | "infrastructure"
  | "grievance"
  | "health"
  | "education"
  | "public_safety"
  | "governance"
  | "other";

export type Role = "collector" | "administrator" | "department_officer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  designation: string;
  departmentId?: string | undefined;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
}

export interface District {
  id: string;
  name: string;
  tamilName?: string;
  state: string;
  isDemo: boolean;
  hasData: boolean;
  geography?: { latitude: number; longitude: number; zoom: number };
}

export interface GeoLocation {
  name: string;
  taluk: string;
  /** Sample coordinates for demonstration records only. Absent = unresolved. */
  lat?: number | undefined;
  lng?: number | undefined;
  resolved: boolean;
}

export interface Department {
  id: string;
  name: string;
  shortName: string;
  headDesignation: string;
}

export type IncidentStatus =
  "new" | "under_investigation" | "action_assigned" | "resolved" | "closed";
export type VerificationStatus = "ai_extracted" | "verified" | "needs_review" | "rejected";

export interface IncidentEvent {
  date: string;
  actor: string;
  event: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  aiSummary: string;
  category: Category;
  location: GeoLocation;
  reportedDate: string;
  priority: Priority;
  departmentId: string;
  status: IncidentStatus;
  verification: VerificationStatus;
  confidence: number;
  articleIds: string[];
  sourceCount: number;
  relatedIncidentIds: string[];
  historicalNote?: string | undefined;
  history: IncidentEvent[];
  isDemo: boolean;
}

export type ProcessingStatus = "processed" | "duplicate" | "pending" | "failed";

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  publishedDate: string;
  location: GeoLocation;
  category: Category;
  priority: Priority;
  aiSummary: string;
  processingStatus: ProcessingStatus;
  url: string;
  incidentId?: string | undefined;
  clusterId?: string | undefined;
  isDemo: boolean;
}

export interface NewsCluster {
  id: string;
  incidentId: string;
  title: string;
  articleIds: string[];
  sources: string[];
  combinedSummary: string;
  firstReported: string;
  latestReported: string;
  category: Category;
  priority: Priority;
}

export interface AIStructuredSummary {
  id: string;
  title: string;
  whatHappened: string;
  where: string;
  when: string;
  whyImportant: string;
  pattern: string;
  department: string;
  followUp: string;
  confidence: number;
  supportingArticleIds: string[];
  incidentIds: string[];
  category: Category;
  priority: Priority;
}

export interface NewsInsights {
  recurringIssues: { label: string; count: number; category: Category }[];
  emergingPatterns: { label: string; detail: string }[];
  frequentLocations: { location: string; count: number }[];
  categoryFrequency: { category: Category; count: number }[];
  departmentConcerns: { departmentId: string; department: string; count: number }[];
  developments: { label: string; detail: string; articleId: string }[];
}

export type ActionStatus = "open" | "in_progress" | "under_review" | "completed" | "on_hold";

export interface ActionComment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  priority: Priority;
  dueDate: string;
  status: ActionStatus;
  incidentId?: string | undefined;
  createdAt: string;
  completedAt?: string | undefined;
  comments: ActionComment[];
}

export interface ActionInput {
  title: string;
  description: string;
  departmentId: string;
  priority: Priority;
  dueDate: string;
  incidentId?: string | undefined;
}

export type WarningType = "heavy_rain" | "cyclone" | "heatwave" | "thunderstorm" | "flood";
export type WarningLevel = "red" | "orange" | "yellow" | "green";

export interface WeatherWarning {
  id: string;
  type: WarningType;
  level: WarningLevel;
  title: string;
  description: string;
  areas: string[];
  issuedAt: string;
  validUntil: string;
  source: string;
  active: boolean;
}

export interface RainfallRecord {
  date: string;
  actualMm: number;
  normalMm: number;
}

export interface MonthlyWeather {
  month: string;
  rainfallMm: number;
  normalMm: number;
  maxTempC: number;
}

export interface ForecastDay {
  date: string;
  condition: string;
  maxC: number | null;
  minC: number | null;
  rainChance: number | null;
  rainMm?: number | null;
}

export interface WeatherOverview {
  provider?: { name: string; url: string; kind: string; warningsConnected: boolean; note: string };
  freshness?: string;
  fetchedAt?: string;
  current: {
    tempC: number;
    humidity: number;
    windKmph: number;
    condition: string;
    observedAt: string;
  };
  rainfall: RainfallRecord[];
  warnings: WeatherWarning[];
  monthly: MonthlyWeather[];
  forecast: ForecastDay[];
}

export interface CommodityPricePoint {
  week: string;
  [commodity: string]: number | string;
}

export interface AgricultureOverview {
  freshness?: string;
  fetchedAt?: string;
  provider?: { name: string; resourceId: string; status: string; note: string };
  commodities: string[];
  prices: CommodityPricePoint[];
  arrivals: CommodityPricePoint[];
  latestPrices: {
    commodity: string;
    market: string;
    modalPrice: number;
    unit: string;
    changePct: number | null;
    minPrice?: number;
    maxPrice?: number;
    date?: string;
    variety?: string;
    grade?: string;
  }[];
  schemes: { scheme: string; target: number; covered: number }[];
  visits: { block: string; visits: number; farmersReached: number }[];
  villages: {
    village: string;
    taluk: string;
    cropArea: number;
    irrigatedPct: number;
    soilCards: number;
  }[];
}

export interface LeaveOverview {
  totals: { total: number; pending: number; approved: number; rejected: number };
  byDepartment: {
    departmentId: string;
    department: string;
    pending: number;
    approved: number;
    rejected: number;
  }[];
  monthly: { month: string; approved: number; rejected: number; pending: number }[];
  byType: { type: string; count: number }[];
  recentRequests: {
    ref: string;
    employeeRef: string;
    department: string;
    type: string;
    days: number;
    status: "pending" | "approved" | "rejected";
    appliedOn: string;
  }[];
}

export type SourceType =
  "rest_api" | "public_webpage" | "csv" | "excel" | "json" | "xml" | "document_upload";
export type SourceStatus = "connected" | "failed" | "disabled" | "pending";
export type SourceCategory =
  "farmwise" | "government" | "news" | "weather" | "agriculture" | "custom";

export interface DataSource {
  id: string;
  name: string;
  url: string;
  description: string;
  category: SourceCategory;
  type: SourceType;
  coverage: string;
  accessMethod: string;
  authRequired: boolean;
  frequency: string;
  status: SourceStatus;
  lastSync?: string | undefined;
  nextSync?: string | undefined;
  recordsCollected: number;
}

export type DataSourceInput = Omit<
  DataSource,
  "id" | "status" | "lastSync" | "nextSync" | "recordsCollected"
>;

export interface SyncLog {
  id: string;
  sourceId: string;
  startedAt: string;
  durationSec: number;
  status: "success" | "failed" | "partial";
  records: number;
  message: string;
}

export interface KpiSummary {
  weatherAlertsAvailable?: boolean;
  activeIncidents: number;
  criticalIncidents: number;
  highPriority: number;
  weatherAlerts: number;
  pendingActions: number;
  newsAnalyzed: number;
  incidentsLast7: number;
  incidentsPrev7: number;
}

export interface OverviewData {
  kpis: KpiSummary;
  criticalAlerts: Incident[];
  daily: { date: string; count: number }[];
  weekly: { week: string; count: number }[];
  byCategory: { category: Category; count: number }[];
  byLocation: { location: string; count: number }[];
  departments: DepartmentStats[];
  summaries: AIStructuredSummary[];
  recentNews: NewsArticle[];
  sourceHealth: SourceHealth;
}

export interface DepartmentStats {
  departmentId: string;
  department: string;
  shortName: string;
  activeIncidents: number;
  pendingActions: number;
  completedActions: number;
  highPriority: number;
  critical: number;
  latestUpdate?: string | undefined;
}

export interface SourceHealth {
  connected: number;
  failed: number;
  disabled: number;
  pending: number;
  lastSync?: string | undefined;
  sources: DataSource[];
}

export type WidgetId =
  | "incident_overview"
  | "critical_alerts"
  | "news_intelligence"
  | "weather_summary"
  | "agriculture_summary"
  | "department_performance"
  | "action_tracker"
  | "incident_map"
  | "trend_analysis"
  | "source_health";

export interface DashboardPreferences {
  widgets: WidgetId[];
  categories: Category[];
  locations: string[];
  alerts: {
    critical: boolean;
    high: boolean;
    weather: boolean;
    overdueActions: boolean;
    email: boolean;
  };
  updatedAt?: string | undefined;
}

export interface Paginated<T> {
  items: T[];
  total: number;
}

export type ReportType =
  | "daily"
  | "weekly"
  | "monthly"
  | "critical"
  | "department"
  | "news_trend"
  | "weather"
  | "agriculture";

export interface ReportRequest {
  type: ReportType;
  from: string;
  to: string;
  categories: Category[];
  departmentIds: string[];
  priorities: Priority[];
}

export interface ReportSection {
  heading: string;
  kind: "verified" | "ai" | "data";
  paragraphs?: string[] | undefined;
  table?: { columns: string[]; rows: (string | number)[][] } | undefined;
}

export interface GeneratedReport {
  title: string;
  district: string;
  generatedAt: string;
  period: string;
  sections: ReportSection[];
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  date: string;
  priority: Priority;
  link: string;
  read: boolean;
}

export interface SearchResult {
  type: "incident" | "article" | "action" | "department";
  id: string;
  title: string;
  subtitle: string;
  link: string;
}

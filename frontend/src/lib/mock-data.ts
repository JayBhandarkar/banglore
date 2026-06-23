import type { EventData, PredictionResult, RiskItem } from "./types";

export const EVENT_TYPES = [
  "Planned Event",
  "Unplanned Event",
  "Festival",
  "Protest",
  "VIP Movement",
  "Sports",
  "Construction",
  "Accident",
  "Public Gathering",
];
export const EVENT_CAUSES = [
  "Religious Procession",
  "Concert",
  "Political Rally",
  "Cricket Match",
  "Marathon",
  "Road Work",
  "Vehicle Breakdown",
  "Weather",
  "Diplomatic Visit",
];
export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export const VEHICLE_TYPES = [
  "Mixed Traffic",
  "Two-Wheeler Heavy",
  "Four-Wheeler Heavy",
  "Commercial",
  "Public Transit",
];
export const CORRIDORS = [
  "Outer Ring Road",
  "MG Road Corridor",
  "Whitefield Main Rd",
  "Hosur Road",
  "Bannerghatta Road",
  "Sarjapur Road",
  "Old Airport Road",
  "Tumkur Road",
];
export const ZONES = [
  "CBD",
  "East",
  "West",
  "North",
  "South",
  "Whitefield",
  "Electronic City",
  "Yelahanka",
];
export const JUNCTIONS = [
  "Silk Board Junction",
  "Hebbal Flyover",
  "KR Puram",
  "Marathahalli Bridge",
  "Trinity Circle",
  "Sirsi Circle",
  "Tin Factory",
  "Domlur Flyover",
  "Cubbon Park",
];
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const BENGALURU_CENTER: [number, number] = [77.5946, 12.9716];

export const DEFAULT_EVENT: EventData = {
  eventType: "Festival",
  eventCause: "Religious Procession",
  priority: "High",
  roadClosure: "Yes",
  vehicleType: "Mixed Traffic",
  corridor: "MG Road Corridor",
  zone: "CBD",
  junction: "Trinity Circle",
  startTime: "18:30",
  dayOfWeek: "Friday",
  month: "Nov",
  lng: BENGALURU_CENTER[0],
  lat: BENGALURU_CENTER[1],
};

export function generatePrediction(event: EventData): PredictionResult {
  const priorityScore = { Low: 20, Medium: 45, High: 72, Critical: 92 }[event.priority];
  const closureBoost = event.roadClosure === "Yes" ? 8 : 0;
  const score = Math.min(
    99,
    priorityScore + closureBoost + (event.eventType === "Festival" ? 4 : 0),
  );
  const level: PredictionResult["impactLevel"] =
    score >= 85 ? "Critical" : score >= 65 ? "High" : score >= 40 ? "Medium" : "Low";
  const officers = Math.round(score / 4.5);
  const barricades = Math.round(score / 2.3);
  return {
    impactLevel: level,
    impactScore: score,
    confidence: 82 + Math.round(Math.random() * 12),
    policeRequired: officers,
    barricadesRequired: barricades,
    diversionStrategy: event.roadClosure === "Yes" ? "Mandatory Diversion" : "Advisory Diversion",
    emergencyResponse:
      level === "Critical" ? "High Alert" : level === "High" ? "Elevated" : "Standard",
    congestionReduction: 28 + Math.round(Math.random() * 18),
    responseEfficiency: 78 + Math.round(Math.random() * 14),
    readinessScore: 80 + Math.round(Math.random() * 15),
  };
}

export const RISK_CORRIDORS: RiskItem[] = [
  { name: "MG Road Corridor", zone: "CBD", riskScore: 94, level: "Critical" },
  { name: "Hosur Road", zone: "South", riskScore: 88, level: "Critical" },
  { name: "Outer Ring Road (Marathahalli)", zone: "East", riskScore: 81, level: "High" },
  { name: "Bannerghatta Road", zone: "South", riskScore: 74, level: "High" },
  { name: "Sarjapur Road", zone: "East", riskScore: 68, level: "High" },
  { name: "Tumkur Road", zone: "West", riskScore: 52, level: "Medium" },
];

export const RISK_JUNCTIONS: RiskItem[] = [
  { name: "Silk Board Junction", zone: "South", riskScore: 96, level: "Critical" },
  { name: "Trinity Circle", zone: "CBD", riskScore: 89, level: "Critical" },
  { name: "Marathahalli Bridge", zone: "East", riskScore: 82, level: "High" },
  { name: "KR Puram", zone: "East", riskScore: 77, level: "High" },
  { name: "Hebbal Flyover", zone: "North", riskScore: 71, level: "High" },
  { name: "Tin Factory", zone: "East", riskScore: 58, level: "Medium" },
];

export const FEATURE_IMPORTANCE = [
  { feature: "Priority Level", importance: 0.92 },
  { feature: "Road Closure", importance: 0.84 },
  { feature: "Event Cause", importance: 0.71 },
  { feature: "Corridor Risk", importance: 0.66 },
  { feature: "Time of Day", importance: 0.58 },
  { feature: "Day of Week", importance: 0.41 },
];

export const PLANNED_VS_UNPLANNED = [
  { month: "Jun", planned: 42, unplanned: 28 },
  { month: "Jul", planned: 38, unplanned: 31 },
  { month: "Aug", planned: 51, unplanned: 24 },
  { month: "Sep", planned: 47, unplanned: 33 },
  { month: "Oct", planned: 62, unplanned: 41 },
  { month: "Nov", planned: 58, unplanned: 36 },
];

export const CAUSE_DISTRIBUTION = [
  { cause: "Procession", count: 84 },
  { cause: "Rally", count: 62 },
  { cause: "Concert", count: 41 },
  { cause: "Sports", count: 38 },
  { cause: "Construction", count: 56 },
  { cause: "Accident", count: 71 },
];

export const MONTHLY_TREND = [
  { month: "Jun", events: 70, impact: 58 },
  { month: "Jul", events: 69, impact: 62 },
  { month: "Aug", events: 75, impact: 64 },
  { month: "Sep", events: 80, impact: 67 },
  { month: "Oct", events: 103, impact: 78 },
  { month: "Nov", events: 94, impact: 82 },
];

export const IMPACT_DISTRIBUTION = [
  { level: "Low", value: 22 },
  { level: "Medium", value: 38 },
  { level: "High", value: 27 },
  { level: "Critical", value: 13 },
];

// Mock geo features for the map overlay (lng, lat)
export const EVENT_PINS = [
  { id: 1, name: "Religious Procession", lng: 77.605, lat: 12.973, level: "Critical" as const },
  { id: 2, name: "Cricket Match", lng: 77.56, lat: 12.997, level: "High" as const },
  { id: 3, name: "Marathon", lng: 77.62, lat: 12.935, level: "Medium" as const },
  { id: 4, name: "Road Work", lng: 77.7, lat: 12.96, level: "Low" as const },
];

export const CORRIDOR_LINES: Array<{
  id: number;
  coords: [number, number][];
  level: "Critical" | "High" | "Medium" | "Low";
}> = [
  {
    id: 1,
    coords: [
      [77.59, 12.97],
      [77.61, 12.975],
      [77.63, 12.98],
      [77.65, 12.985],
    ],
    level: "Critical",
  },
  {
    id: 2,
    coords: [
      [77.56, 12.93],
      [77.58, 12.94],
      [77.6, 12.95],
      [77.62, 12.96],
    ],
    level: "High",
  },
  {
    id: 3,
    coords: [
      [77.55, 13.0],
      [77.57, 13.01],
      [77.6, 13.02],
      [77.63, 13.03],
    ],
    level: "Medium",
  },
  {
    id: 4,
    coords: [
      [77.68, 12.92],
      [77.66, 12.94],
      [77.64, 12.96],
    ],
    level: "High",
  },
];

export const RESOURCE_MARKERS = [
  { id: 1, lng: 77.598, lat: 12.974, type: "Police" },
  { id: 2, lng: 77.612, lat: 12.978, type: "Barricade" },
  { id: 3, lng: 77.575, lat: 12.962, type: "Police" },
  { id: 4, lng: 77.635, lat: 12.945, type: "Barricade" },
];

import type { EventData, PredictionResult, RiskItem } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalyticsData {
  total_events: number;
  allocated_police: number;
  allocated_barricades: number;
  avg_duration: number;
  severity_distribution: Record<string, number>;
  hourly_distribution: Record<string, number>;
  cause_distribution: Record<string, number>;
}

export interface Hotspot {
  id: string;
  junction_name: string;
  score: number;
  event_count: number;
  latitude: number;
  longitude: number;
  last_updated: string;
}

export interface HistoryItem {
  id: string;
  event_type: string;
  event_cause: string;
  requires_road_closure: boolean;
  veh_type: string;
  corridor: string;
  zone: string;
  junction: string;
  latitude: number;
  longitude: number;
  start_datetime: string;
  closed_datetime: string | null;
  duration_minutes: number | null;
  created_at: string;
  predicted_impact_level: string;
  impact_score: number;
  police_required: number;
  barricades_required: number;
  diversion_strategy: string;
}

// Map event type to backend classification
function mapEventType(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("unplanned") || t.includes("accident") || t.includes("protest")) {
    return "unplanned";
  }
  return "planned";
}

// Map event cause to backend categories
function mapEventCause(cause: string): string {
  const c = cause.toLowerCase();
  if (c.includes("procession") || c.includes("religious")) return "procession";
  if (c.includes("work") || c.includes("road work") || c.includes("construction"))
    return "construction";
  if (c.includes("breakdown")) return "vehicle_breakdown";
  if (c.includes("accident") || c.includes("collision")) return "accident";
  if (c.includes("protest") || c.includes("rally")) return "protest";
  if (c.includes("visit") || c.includes("vip")) return "vip_movement";
  if (c.includes("weather") || c.includes("rain") || c.includes("flood")) return "water_logging";
  return c.replace(/\s+/g, "_");
}

// Map vehicle type to backend categories
function mapVehicleType(vehicle: string): string {
  const v = vehicle.toLowerCase();
  if (v.includes("two-wheeler")) return "others";
  if (v.includes("four-wheeler") || v.includes("car")) return "private_car";
  if (v.includes("transit") || v.includes("bus")) return "bmtc_bus";
  if (v.includes("commercial") || v.includes("truck")) return "truck";
  return v.replace(/\s+/g, "_");
}

export async function predictTrafficImpact(event: EventData): Promise<PredictionResult> {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const startTime = event.startTime || "12:00";
  const startDatetime = `${dateStr}T${startTime}:00`;

  // Estimate closed datetime as 2 hours later
  const closedTime = new Date(now.getTime() + 120 * 60 * 1000);
  const closedDatetime = closedTime.toISOString();

  const payload = {
    event_type: mapEventType(event.eventType),
    event_cause: mapEventCause(event.eventCause),
    requires_road_closure: event.roadClosure === "Yes",
    veh_type: mapVehicleType(event.vehicleType),
    corridor: event.corridor || "Non-corridor",
    zone: event.zone || "Unknown",
    junction: event.junction || "Unknown",
    latitude: Number(event.lat) || 12.982847,
    longitude: Number(event.lng) || 77.58946,
    start_datetime: startDatetime,
    closed_datetime: closedDatetime,
  };

  const response = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Failed to run traffic simulation");
  }

  const { prediction, recommendation } = result;

  // Map probability confidence
  const predictedLevel = prediction.predicted_impact_level;
  const probs = prediction.probabilities || {};
  const confidencePercent = Math.round((probs[predictedLevel] || 0.85) * 100);

  // continuous score mapping (FastAPI returns 0 to 1, frontend expects 0 to 100)
  const score = Math.round(prediction.impact_score * 100);

  return {
    impactLevel: predictedLevel,
    impactScore: score,
    confidence: confidencePercent,
    policeRequired: recommendation.police_required,
    barricadesRequired: recommendation.barricades_required,
    diversionStrategy: recommendation.diversion_strategy,
    emergencyResponse:
      predictedLevel === "Critical"
        ? "High Alert"
        : predictedLevel === "High"
          ? "Elevated"
          : "Standard",
    congestionReduction: Math.round(40 - score / 3.5),
    responseEfficiency: Math.round(95 - score / 5),
    readinessScore: Math.round(
      Math.max(40, 92 - recommendation.police_required - recommendation.barricades_required / 2),
    ),
    dispatchedResources: recommendation.dispatched_resources,
  };
}

export async function getAnalytics(): Promise<AnalyticsData> {
  const response = await fetch(`${API_URL}/api/analytics`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data;
}

export async function getHotspots(): Promise<Hotspot[]> {
  const response = await fetch(`${API_URL}/api/hotspots`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data;
}

export async function getHistory(): Promise<HistoryItem[]> {
  const response = await fetch(`${API_URL}/api/history?limit=10000`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data;
}

export interface SystemResources {
  officers: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
    last_updated: string;
  }>;
  barricades: Array<{
    id: string;
    depot_name: string;
    latitude: number;
    longitude: number;
    total_quantity: number;
    available_quantity: number;
    last_updated: string;
  }>;
}

export async function getSystemResources(): Promise<SystemResources> {
  const response = await fetch(`${API_URL}/api/resources`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const result = await response.json();
  return result.data;
}

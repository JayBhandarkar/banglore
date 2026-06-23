export type Priority = "Low" | "Medium" | "High" | "Critical";
export type ImpactLevel = "Low" | "Medium" | "High" | "Critical";

export interface EventData {
  eventType: string;
  eventCause: string;
  priority: Priority;
  roadClosure: "Yes" | "No";
  vehicleType: string;
  corridor: string;
  zone: string;
  junction: string;
  startTime: string;
  dayOfWeek: string;
  month: string;
  lng: number;
  lat: number;
  cctv?: {
    cameraId: string;
    vehicleCount: number;
    congestionLevel: string;
  };
}

export interface DispatchedOfficer {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface DispatchedBarricade {
  id: string;
  depot_name: string;
  latitude: number;
  longitude: number;
  quantity: number;
}

export interface PredictionResult {
  impactLevel: ImpactLevel;
  impactScore: number;
  confidence: number;
  policeRequired: number;
  barricadesRequired: number;
  diversionStrategy: string;
  emergencyResponse: string;
  congestionReduction: number;
  responseEfficiency: number;
  readinessScore: number;
  dispatchedResources?: {
    officers: DispatchedOfficer[];
    barricades: DispatchedBarricade[];
  };
}

export interface RiskItem {
  name: string;
  zone: string;
  riskScore: number;
  level: ImpactLevel;
}

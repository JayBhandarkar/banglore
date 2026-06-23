"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CORRIDOR_LINES, EVENT_PINS, RESOURCE_MARKERS } from "@/lib/mock-data";
import { useBackendData } from "@/hooks/use-backend-data";
import { useEventState } from "@/lib/event-store";

// Fix Leaflet's default icon URLs which break under bundlers
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const RISK_COLORS = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#06b6d4",
  Low: "#3b82f6",
} as const;

// Custom icon factory
function makeIcon(color: string, shape: "circle" | "square" = "circle") {
  const svg =
    shape === "square"
      ? `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16'><rect width='14' height='14' x='1' y='1' rx='2' fill='${color}' stroke='white' stroke-width='1.5'/></svg>`
      : `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='10' cy='10' r='8' fill='${color}' opacity='0.9' stroke='white' stroke-width='2'/></svg>`;
  return L.divIcon({
    className: "",
    html: svg,
    iconSize: shape === "square" ? [16, 16] : [20, 20],
    iconAnchor: shape === "square" ? [8, 8] : [10, 10],
  });
}

// Selected pin marker
function makePinIcon() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36'>
    <circle cx='14' cy='14' r='12' fill='#06b6d4' opacity='0.3'/>
    <circle cx='14' cy='14' r='7' fill='#06b6d4' stroke='white' stroke-width='2.5'/>
    <line x1='14' y1='21' x2='14' y2='34' stroke='#06b6d4' stroke-width='2.5' stroke-linecap='round'/>
  </svg>`;
  return L.divIcon({
    className: "",
    html: svg,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  });
}

// Fly to selected location when it changes
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

// Click handler
function ClickHandler({ onPick }: { onPick?: (lng: number, lat: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lng, e.latlng.lat);
    },
  });
  return null;
}

interface Props {
  className?: string;
  interactive?: boolean;
  onPick?: (lng: number, lat: number) => void;
  selected?: { lng: number; lat: number } | null;
  showOverlays?: boolean;
}

export function LeafletMapInner({
  className,
  interactive = false,
  onPick,
  selected,
  showOverlays = true,
}: Props) {
  const center: [number, number] = [12.9716, 77.5946];
  const { hotspots, history } = useBackendData();
  const { prediction } = useEventState();

  // Map backend hotspots to pins dynamically
  const dynamicPins = hotspots.map((h, i) => {
    const riskScore = Math.round(h.score * 100);
    const level: "Low" | "Medium" | "High" | "Critical" =
      riskScore >= 85 ? "Critical" : riskScore >= 65 ? "High" : riskScore >= 40 ? "Medium" : "Low";
    return {
      id: h.id || `hotspot-${i}`,
      name: h.junction_name,
      lng: h.longitude,
      lat: h.latitude,
      level,
    };
  });

  const pins = dynamicPins.length > 0 ? dynamicPins : EVENT_PINS;

  // Compute dynamic risk levels of corridors from event history
  const corridorRisk: Record<string, number> = {};
  const corridorCount: Record<string, number> = {};
  history.forEach((item) => {
    const corr = item.corridor;
    if (corr) {
      corridorRisk[corr] = (corridorRisk[corr] || 0) + item.impact_score;
      corridorCount[corr] = (corridorCount[corr] || 0) + 1;
    }
  });

  const processedCorridors = CORRIDOR_LINES.map((line) => {
    const name =
      {
        1: "MG Road Corridor",
        2: "Hosur Road",
        3: "Outer Ring Road (Marathahalli)",
        4: "Bannerghatta Road",
      }[line.id] || "";

    const matchingKey = Object.keys(corridorCount).find(
      (key) =>
        key.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(key.toLowerCase()) ||
        (key.toLowerCase().includes("outer ring") && name.toLowerCase().includes("outer ring")),
    );

    if (matchingKey && corridorCount[matchingKey]) {
      const avgScore = (corridorRisk[matchingKey] / corridorCount[matchingKey]) * 100;
      const level: "Low" | "Medium" | "High" | "Critical" =
        avgScore >= 85 ? "Critical" : avgScore >= 65 ? "High" : avgScore >= 40 ? "Medium" : "Low";
      return { ...line, level };
    }
    return line;
  });

  // Dynamically place resources (police and barricades) around the selected incident pin
  const dynamicResources: Array<{
    id: string;
    lat: number;
    lng: number;
    type: "Police" | "Barricade";
    name?: string;
  }> = [];

  if (selected && prediction) {
    if (prediction.dispatchedResources) {
      const { officers, barricades } = prediction.dispatchedResources;
      if (officers) {
        officers.forEach((off) => {
          dynamicResources.push({
            id: `dyn-police-${off.id}`,
            lat: off.latitude,
            lng: off.longitude,
            type: "Police",
            name: off.name,
          });
        });
      }
      if (barricades) {
        barricades.forEach((bar) => {
          dynamicResources.push({
            id: `dyn-barricade-${bar.id}`,
            lat: bar.latitude,
            lng: bar.longitude,
            type: "Barricade",
            name: `${bar.depot_name} (${bar.quantity} dispatched)`,
          });
        });
      }
    } else {
      const policeCount = prediction.policeRequired;
      const barricadesCount = prediction.barricadesRequired;

      // Seeded random number generator fallback
      let seed = 42;
      const lcg = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };

      for (let i = 0; i < Math.min(policeCount, 6); i++) {
        dynamicResources.push({
          id: `dyn-police-${i}`,
          lat: selected.lat + (lcg() - 0.5) * 0.005,
          lng: selected.lng + (lcg() - 0.5) * 0.005,
          type: "Police",
          name: `Officer (Simulated #${i + 1})`,
        });
      }

      for (let i = 0; i < Math.min(barricadesCount, 6); i++) {
        dynamicResources.push({
          id: `dyn-barricade-${i}`,
          lat: selected.lat + (lcg() - 0.5) * 0.005,
          lng: selected.lng + (lcg() - 0.5) * 0.005,
          type: "Barricade",
          name: `Barricade Depot (Simulated #${i + 1})`,
        });
      }
    }
  }

  const markers =
    dynamicResources.length > 0
      ? dynamicResources
      : RESOURCE_MARKERS.map((m) => ({
          id: `static-res-${m.id}`,
          lat: m.lat,
          lng: m.lng,
          type: m.type as "Police" | "Barricade",
          name: m.type === "Police" ? "Traffic Officer" : "Barricade Station",
        }));

  return (
    <MapContainer
      center={center}
      zoom={12}
      zoomControl={interactive}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      style={{ height: "100%", width: "100%", background: "#0d1b2a" }}
      className={className}
      attributionControl={false}
    >
      {/* Dark satellite-style tile from CartoDB Voyager Dark Matter */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {/* Click to pick location */}
      {interactive && <ClickHandler onPick={onPick} />}

      {/* Fly to selected pin */}
      {selected && <FlyTo lat={selected.lat} lng={selected.lng} />}

      {/* Dynamic impact corridor circle overlay for newly selected incidents */}
      {selected && prediction && (
        <CircleMarker
          center={[selected.lat, selected.lng]}
          radius={45}
          pathOptions={{
            color: RISK_COLORS[prediction.impactLevel],
            fillColor: RISK_COLORS[prediction.impactLevel],
            fillOpacity: 0.1,
            weight: 2,
            dashArray: "5 5",
          }}
        />
      )}

      {/* Corridor polylines */}
      {showOverlays &&
        processedCorridors.map((c) => (
          <Polyline
            key={c.id}
            positions={c.coords.map(([lng, lat]) => [lat, lng])}
            pathOptions={{
              color: RISK_COLORS[c.level],
              weight: 4,
              opacity: 0.85,
              dashArray: c.level === "Critical" ? undefined : "10 6",
            }}
          />
        ))}

      {/* Event heatmap glow */}
      {showOverlays &&
        pins.map((p) => (
          <CircleMarker
            key={`heat-${p.id}`}
            center={[p.lat, p.lng]}
            radius={28}
            pathOptions={{
              color: RISK_COLORS[p.level],
              fillColor: RISK_COLORS[p.level],
              fillOpacity: 0.18,
              weight: 0,
            }}
          />
        ))}

      {/* Event pins */}
      {showOverlays &&
        pins.map((p) => (
          <Marker
            key={`pin-${p.id}`}
            position={[p.lat, p.lng]}
            icon={makeIcon(RISK_COLORS[p.level])}
          />
        ))}

      {/* Resource markers (police / barricades) */}
      {showOverlays &&
        markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={makeIcon(m.type === "Police" ? "#3b82f6" : "#f59e0b", "square")}
          >
            {m.name && (
              <Popup>
                <div style={{ padding: "4px", fontSize: "11px", fontWeight: "600", color: "#333" }}>
                  {m.type === "Police" ? "👮 Officer" : "🚧 Depot"}: {m.name}
                </div>
              </Popup>
            )}
          </Marker>
        ))}

      {/* Selected pick marker */}
      {selected && <Marker position={[selected.lat, selected.lng]} icon={makePinIcon()} />}
    </MapContainer>
  );
}

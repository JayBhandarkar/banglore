"use client";

import { useEffect, useState } from "react";
import { CORRIDOR_LINES, EVENT_PINS, RESOURCE_MARKERS } from "@/lib/mock-data";

const RISK_COLORS = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#06b6d4",
  Low: "#3b82f6",
} as const;

interface Props {
  className?: string;
  interactive?: boolean;
  onPick?: (lng: number, lat: number) => void;
  selected?: { lng: number; lat: number } | null;
  showOverlays?: boolean;
  compact?: boolean;
}

// Leaflet must only run client-side. We lazy-import it inside the component.
export function MapboxMap({
  className,
  interactive = false,
  onPick,
  selected,
  showOverlays = true,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [LeafletMap, setLeafletMap] = useState<React.ComponentType<Props> | null>(null);

  useEffect(() => {
    setMounted(true);
    import("./leaflet-map-inner").then((mod) => {
      setLeafletMap(() => mod.LeafletMapInner);
    });
  }, []);

  if (!mounted || !LeafletMap) {
    return (
      <div
        className={className}
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, oklch(0.22 0.030 252) 0%, oklch(0.14 0.022 252) 70%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "oklch(0.68 0.025 250)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 11,
          }}
        >
          LOADING MAP…
        </span>
      </div>
    );
  }

  return (
    <LeafletMap
      className={className}
      interactive={interactive}
      onPick={onPick}
      selected={selected}
      showOverlays={showOverlays}
    />
  );
}

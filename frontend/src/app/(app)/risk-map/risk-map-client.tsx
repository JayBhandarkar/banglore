"use client";

import { useEffect } from "react";
import { MapboxMap } from "@/components/mapbox-map";

import { Panel } from "@/components/panel";
import { RiskListCard } from "@/components/risk-list-card";
import { useBackendData } from "@/hooks/use-backend-data";
import type { RiskItem } from "@/lib/types";
import { RISK_CORRIDORS, RISK_JUNCTIONS } from "@/lib/mock-data";
import { useEventState, eventStore } from "@/lib/event-store";

export default function RiskMap() {
  const { event } = useEventState();
  const { hotspots, history } = useBackendData();

  useEffect(() => {
    if (!event) eventStore.ensureDemo();
  }, [event]);

  // Map API hotspots dynamically to Risk items
  const dynamicJunctions: RiskItem[] = hotspots.map((h) => {
    const riskScore = Math.round(h.score * 100);
    const level: "Low" | "Medium" | "High" | "Critical" =
      riskScore >= 85 ? "Critical" : riskScore >= 65 ? "High" : riskScore >= 40 ? "Medium" : "Low";

    let zone = "Unknown";
    const jName = h.junction_name.toLowerCase();
    if (jName.includes("silk") || jName.includes("jayanagar")) zone = "South";
    else if (jName.includes("hebbal") || jName.includes("yelahanka")) zone = "North";
    else if (
      jName.includes("kr puram") ||
      jName.includes("marathahalli") ||
      jName.includes("whitefield")
    )
      zone = "East";
    else if (jName.includes("trinity") || jName.includes("mg road") || jName.includes("cbd"))
      zone = "CBD";
    else if (jName.includes("peenya") || jName.includes("mysore")) zone = "West";

    return {
      name: h.junction_name,
      zone,
      riskScore,
      level,
    };
  });

  const junctionsList = dynamicJunctions.length > 0 ? dynamicJunctions : RISK_JUNCTIONS;

  // Group by corridor to compute dynamic risk corridors from backend history
  const corridorGroups: Record<string, { totalScore: number; count: number; zone: string }> = {};
  history.forEach((item) => {
    const corr = item.corridor || "Non-corridor";
    if (!corridorGroups[corr]) {
      corridorGroups[corr] = { totalScore: 0, count: 0, zone: item.zone || "Unknown" };
    }
    corridorGroups[corr].totalScore += item.impact_score;
    corridorGroups[corr].count += 1;
  });

  const dynamicCorridors: RiskItem[] = Object.entries(corridorGroups)
    .map(([name, data]) => {
      const avgScore = data.totalScore / data.count;
      const riskScore = Math.round(avgScore * 100);
      const level: "Low" | "Medium" | "High" | "Critical" =
        riskScore >= 85
          ? "Critical"
          : riskScore >= 65
            ? "High"
            : riskScore >= 40
              ? "Medium"
              : "Low";

      return {
        name,
        zone: data.zone,
        riskScore,
        level,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);

  const corridorsList = dynamicCorridors.length > 0 ? dynamicCorridors : RISK_CORRIDORS;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Panel
        title="Citywide Risk Map"
        subtitle="Aggregated heatmap · live"
        className="overflow-hidden"
      >
        <div className="-m-4 relative h-[640px] overflow-hidden border-t border-border">
          <MapboxMap
            className="absolute inset-0 h-full w-full"
            selected={event ? { lng: event.lng, lat: event.lat } : null}
          />
        </div>
      </Panel>
      <div className="flex flex-col gap-4">
        <RiskListCard
          title="Top Risk Corridors"
          subtitle="Ranked · projected impact"
          items={corridorsList}
        />
        <RiskListCard
          title="Top Risk Junctions"
          subtitle="Ranked · projected impact"
          items={junctionsList}
        />
      </div>
    </div>
  );
}

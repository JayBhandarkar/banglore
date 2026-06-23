"use client";

import { useEffect } from "react";
import { MapboxMap } from "@/components/mapbox-map";
import { EventSummaryCard } from "@/components/event-summary-card";
import { ImpactPredictionCard } from "@/components/impact-prediction-card";
import { ResourceRecommendationCard } from "@/components/resource-recommendation-card";
import { RiskListCard } from "@/components/risk-list-card";
import { ExplainableAICard } from "@/components/explainable-ai-card";
import { AnalyticsSection } from "@/components/analytics-section";
import { ResourceOptimizationSection } from "@/components/resource-optimization-section";
import { CctvComingSoon } from "@/components/cctv-coming-soon";
import { Panel } from "@/components/panel";

import { eventStore, useEventState } from "@/lib/event-store";
import { useBackendData } from "@/hooks/use-backend-data";
import { RISK_CORRIDORS, RISK_JUNCTIONS } from "@/lib/mock-data";
import type { RiskItem } from "@/lib/types";

export default function CommandCenter() {
  const { event, prediction } = useEventState();
  const { analytics, hotspots, history } = useBackendData();

  useEffect(() => {
    if (!event) eventStore.ensureDemo();
  }, [event]);

  if (!event || !prediction) {
    return (
      <div className="grid place-items-center py-20 text-muted-foreground">Loading scenario…</div>
    );
  }

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

  const totalEvents = analytics?.total_events ?? history.length;
  const telemetryData = [
    ["Sensors", `${(totalEvents * 15 + 234).toLocaleString()}`, "online"],
    ["Cameras", `${(totalEvents * 8 + 112).toLocaleString()}`, "streaming"],
    ["Signals", `${(totalEvents * 5 + 47).toLocaleString()}`, "synced"],
    ["Vehicles", `${(totalEvents * 1.5 + 42).toFixed(1)}k`, "tracked"],
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top hero row: summary + map + intelligence */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <EventSummaryCard event={event} />
          <Panel title="Live Telemetry" subtitle="Network status">
            <div className="grid grid-cols-2 gap-2">
              {telemetryData.map(([label, value, sub]) => (
                <div key={label} className="rounded-md border border-border bg-surface/60 p-2.5">
                  <p className="text-mono text-[9px] uppercase text-muted-foreground">{label}</p>
                  <p className="text-display text-base font-semibold tabular-nums">{value}</p>
                  <p className="text-mono text-[9px] uppercase text-success">{sub}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Map — primary visual */}
        <Panel
          title="Bengaluru Live Operations"
          subtitle="Heatmap · corridors · resources"
          className="overflow-hidden"
          badge={
            <div className="flex items-center gap-2">
              {(["Low", "Medium", "High", "Critical"] as const).map((l) => (
                <span
                  key={l}
                  className="flex items-center gap-1 text-mono text-[10px] uppercase text-muted-foreground"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background: {
                        Low: "oklch(0.63 0.19 258)",
                        Medium: "oklch(0.74 0.13 207)",
                        High: "oklch(0.78 0.16 75)",
                        Critical: "oklch(0.66 0.22 25)",
                      }[l],
                    }}
                  />
                  {l}
                </span>
              ))}
            </div>
          }
        >
          <div className="-m-4 relative h-[460px] overflow-hidden border-t border-border xl:h-[560px]">
            <MapboxMap
              className="absolute inset-0 h-full w-full"
              selected={{ lng: event.lng, lat: event.lat }}
            />
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <ImpactPredictionCard p={prediction} />
          <ResourceRecommendationCard p={prediction} />
        </div>
      </div>

      {/* Mid intelligence row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
        <ExplainableAICard />
      </div>

      {/* Analytics */}
      <AnalyticsSection />

      {/* Resource optimization */}
      <ResourceOptimizationSection p={prediction} />

      {/* CCTV Coming soon */}
      <CctvComingSoon />
    </div>
  );
}

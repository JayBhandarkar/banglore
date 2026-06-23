"use client";

import { useEffect } from "react";
import { Panel } from "@/components/panel";
import { ResourceOptimizationSection } from "@/components/resource-optimization-section";
import { ResourceRecommendationCard } from "@/components/resource-recommendation-card";
import { eventStore, useEventState } from "@/lib/event-store";

export default function ResourcePlanner() {
  const { event, prediction } = useEventState();

  useEffect(() => {
    if (!event) eventStore.ensureDemo();
  }, [event]);

  if (!prediction || !event) return null;

  const sectors = [
    { name: "Sector A · CBD Core", officers: 12, barricades: 22, status: "Deployed" },
    { name: "Sector B · East Ring", officers: 8, barricades: 14, status: "Mobilizing" },
    { name: "Sector C · South Arterial", officers: 6, barricades: 10, status: "Standby" },
    { name: "Sector D · Diversion Loop", officers: 4, barricades: 8, status: "Ready" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ResourceRecommendationCard p={prediction} />
        <Panel title="Sector Deployment" subtitle="Operational allocation">
          <ul className="flex flex-col">
            {sectors.map((s) => (
              <li
                key={s.name}
                className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-mono text-[10px] uppercase text-muted-foreground">
                    {s.officers} officers · {s.barricades} barricades
                  </p>
                </div>
                <span
                  className={`rounded-md border px-2 py-0.5 text-mono text-[10px] uppercase tracking-wider ${
                    s.status === "Deployed"
                      ? "border-success/40 bg-success/10 text-success"
                      : s.status === "Mobilizing"
                        ? "border-warning/40 bg-warning/10 text-warning"
                        : s.status === "Standby"
                          ? "border-cyan/40 bg-cyan/10 text-cyan"
                          : "border-primary/40 bg-primary/10 text-primary"
                  }`}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <ResourceOptimizationSection p={prediction} />
    </div>
  );
}

"use client";

import { Panel } from "@/components/panel";
import { AnalyticsSection } from "@/components/analytics-section";
import { ExplainableAICard } from "@/components/explainable-ai-card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Reports() {
  const reports = [
    {
      id: "RPT-2026-0421",
      title: "November Event Impact Brief",
      date: "06 Dec 2025",
      status: "Final",
    },
    {
      id: "RPT-2026-0418",
      title: "Marathon Q4 Mobilization Review",
      date: "01 Dec 2025",
      status: "Final",
    },
    {
      id: "RPT-2026-0412",
      title: "Procession Corridor Stress Test",
      date: "24 Nov 2025",
      status: "Draft",
    },
    {
      id: "RPT-2026-0407",
      title: "Silk Board Junction Throughput",
      date: "18 Nov 2025",
      status: "Final",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <AnalyticsSection />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Operational Reports" subtitle="Archive · last 30 days">
          <ul className="flex flex-col">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0"
              >
                <div className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface">
                  <FileText className="h-4 w-4 text-cyan" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="text-mono text-[10px] uppercase text-muted-foreground">
                    {r.id} · {r.date}
                  </p>
                </div>
                <span
                  className={`rounded-md border px-2 py-0.5 text-mono text-[10px] uppercase ${
                    r.status === "Final"
                      ? "border-success/40 bg-success/10 text-success"
                      : "border-warning/40 bg-warning/10 text-warning"
                  }`}
                >
                  {r.status}
                </span>
                <Button size="sm" variant="outline" className="border-border bg-surface">
                  <Download className="h-3 w-3" /> PDF
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
        <ExplainableAICard />
      </div>
    </div>
  );
}

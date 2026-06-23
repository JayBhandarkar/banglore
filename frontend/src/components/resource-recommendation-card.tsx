import { Users, Construction, Route as RouteIcon, Siren } from "lucide-react";
import { Panel } from "./panel";
import type { PredictionResult } from "@/lib/types";

export function ResourceRecommendationCard({ p }: { p: PredictionResult }) {
  const items = [
    {
      icon: Users,
      label: "Police Officers",
      value: p.policeRequired,
      suffix: "deployed",
      tone: "primary",
    },
    {
      icon: Construction,
      label: "Barricades",
      value: p.barricadesRequired,
      suffix: "units",
      tone: "cyan",
    },
    { icon: RouteIcon, label: "Diversion", value: p.diversionStrategy, tone: "warning" },
    { icon: Siren, label: "Emergency", value: p.emergencyResponse, tone: "critical" },
  ] as const;

  const toneClass: Record<string, string> = {
    primary: "text-primary bg-primary/10 border-primary/30",
    cyan: "text-cyan bg-cyan/10 border-cyan/30",
    warning: "text-warning bg-warning/10 border-warning/30",
    critical: "text-destructive bg-destructive/10 border-destructive/30",
  };

  return (
    <Panel
      title="Resource Recommendations"
      subtitle="Optimized deployment plan"
      badge={
        <span className="rounded-md border border-success/40 bg-success/10 px-2 py-0.5 text-mono text-[10px] uppercase tracking-wider text-success">
          Ready
        </span>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border border-border bg-surface/60 p-3">
            <div
              className={`mb-2 grid h-7 w-7 place-items-center rounded-md border ${toneClass[it.tone]}`}
            >
              <it.icon className="h-3.5 w-3.5" />
            </div>
            <p className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {it.label}
            </p>
            <p className="text-display text-lg font-bold tabular-nums leading-tight">{it.value}</p>
            {"suffix" in it && it.suffix && (
              <p className="text-mono text-[9px] uppercase text-muted-foreground">{it.suffix}</p>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

import {
  Users,
  Construction,
  Route as RouteIcon,
  TrendingDown,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { Panel } from "./panel";
import type { PredictionResult } from "@/lib/types";
import { motion } from "framer-motion";

export function ResourceOptimizationSection({ p }: { p: PredictionResult }) {
  const stats = [
    {
      icon: Users,
      label: "Police Required",
      value: p.policeRequired,
      unit: "officers",
      tone: "primary",
    },
    {
      icon: Construction,
      label: "Barricades",
      value: p.barricadesRequired,
      unit: "units",
      tone: "cyan",
    },
    { icon: RouteIcon, label: "Diversion Routes", value: 4, unit: "active", tone: "warning" },
    {
      icon: TrendingDown,
      label: "Congestion Reduction",
      value: `${p.congestionReduction}%`,
      unit: "projected",
      tone: "success",
      progress: p.congestionReduction,
    },
    {
      icon: Gauge,
      label: "Response Efficiency",
      value: `${p.responseEfficiency}%`,
      unit: "real-time",
      tone: "primary",
      progress: p.responseEfficiency,
    },
    {
      icon: ShieldCheck,
      label: "Readiness Score",
      value: `${p.readinessScore}/100`,
      unit: "operational",
      tone: "success",
      progress: p.readinessScore,
    },
  ] as const;

  const toneClass: Record<string, string> = {
    primary: "text-primary border-primary/30 bg-primary/10",
    cyan: "text-cyan border-cyan/30 bg-cyan/10",
    warning: "text-warning border-warning/30 bg-warning/10",
    success: "text-success border-success/30 bg-success/10",
  };

  return (
    <Panel title="Resource Optimization" subtitle="Deployment & efficiency outlook">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-lg border border-border bg-surface/60 p-3"
          >
            <div className="flex items-center justify-between">
              <div
                className={`grid h-7 w-7 place-items-center rounded-md border ${toneClass[s.tone]}`}
              >
                <s.icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {s.unit}
              </span>
            </div>
            <p className="mt-2 text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
            <p className="text-display text-xl font-bold tabular-nums">{s.value}</p>
            {"progress" in s && s.progress !== undefined && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.progress}%` }}
                  transition={{ duration: 0.9, delay: 0.2 + i * 0.06 }}
                  className="h-full bg-[var(--grad-primary)]"
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Panel>
  );
}

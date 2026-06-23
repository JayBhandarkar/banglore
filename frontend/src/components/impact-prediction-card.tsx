import { motion } from "framer-motion";
import { Activity, ShieldAlert } from "lucide-react";
import { Panel } from "./panel";
import type { PredictionResult } from "@/lib/types";

const levelColor = {
  Low: {
    ring: "oklch(0.63 0.19 258)",
    text: "text-primary",
    chip: "bg-primary/15 text-primary border-primary/40",
  },
  Medium: {
    ring: "oklch(0.74 0.13 207)",
    text: "text-cyan",
    chip: "bg-cyan/15 text-cyan border-cyan/40",
  },
  High: {
    ring: "oklch(0.78 0.16 75)",
    text: "text-warning",
    chip: "bg-warning/15 text-warning border-warning/40",
  },
  Critical: {
    ring: "oklch(0.66 0.22 25)",
    text: "text-destructive",
    chip: "bg-destructive/15 text-destructive border-destructive/40",
  },
};

export function ImpactPredictionCard({ p }: { p: PredictionResult }) {
  const c = levelColor[p.impactLevel];
  const dash = (p.impactScore / 100) * 282.7; // 2*pi*45
  return (
    <Panel
      title="Traffic Impact Prediction"
      subtitle="ML Forecast · BTP-Predict v2.3"
      badge={
        <span
          className={`rounded-md border px-2 py-0.5 text-mono text-[10px] uppercase tracking-wider ${c.chip}`}
        >
          {p.impactLevel}
        </span>
      }
    >
      <div className="flex items-center gap-4">
        <div className="relative grid h-28 w-28 shrink-0 place-items-center">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="oklch(1 0 0 / 0.07)"
              strokeWidth="6"
              fill="none"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke={c.ring}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="282.7"
              initial={{ strokeDashoffset: 282.7 }}
              animate={{ strokeDashoffset: 282.7 - dash }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute flex flex-col items-center leading-tight">
            <span className={`text-display text-[28px] font-bold tabular-nums ${c.text}`}>
              {p.impactScore}
            </span>
            <span className="text-mono text-[9px] uppercase text-muted-foreground">/ 100</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <Metric
            icon={<Activity className="h-3 w-3" />}
            label="Confidence"
            value={`${p.confidence}%`}
          />
          <Metric
            icon={<ShieldAlert className="h-3 w-3" />}
            label="Response"
            value={p.emergencyResponse}
          />
          <div className="rounded-md border border-border bg-surface/60 px-2.5 py-1.5">
            <p className="text-mono text-[9px] uppercase text-muted-foreground">
              Reduction Potential
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.congestionReduction}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="h-full bg-[var(--grad-primary)]"
                />
              </div>
              <span className="text-mono text-xs font-semibold text-foreground">
                {p.congestionReduction}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border bg-surface/60 px-2.5 py-1.5">
      <span className="flex items-center gap-1.5 text-mono text-[9px] uppercase text-muted-foreground">
        {icon} {label}
      </span>
      <span className="text-xs font-semibold text-foreground">{value}</span>
    </div>
  );
}

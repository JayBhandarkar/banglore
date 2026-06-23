import { Camera, Eye, Activity, AlertCircle, BarChart3 } from "lucide-react";
import { Panel } from "./panel";

export function CctvComingSoon() {
  const features = [
    { icon: Eye, label: "YOLO Vehicle Detection" },
    { icon: Camera, label: "Live CCTV Monitoring" },
    { icon: BarChart3, label: "Vehicle Count" },
    { icon: Activity, label: "Congestion Index" },
    { icon: AlertCircle, label: "Real-Time Alerts" },
  ];

  return (
    <Panel
      title="CCTV Intelligence"
      subtitle="Phase 2 Integration"
      badge={
        <span className="rounded-md border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-mono text-[10px] uppercase tracking-wider text-cyan">
          Coming Soon
        </span>
      }
    >
      <div className="relative overflow-hidden rounded-lg border border-border bg-[radial-gradient(ellipse_at_top,oklch(0.63_0.19_258/0.18),transparent_60%)] p-5">
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--grad-primary)] glow-primary">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-display text-base font-semibold">Computer Vision Pipeline</h4>
              <p className="text-xs text-muted-foreground">
                Real-time vehicle detection & congestion analytics from Bengaluru's CCTV network.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            {features.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-md border border-border bg-surface/60 px-2.5 py-2"
              >
                <f.icon className="h-3.5 w-3.5 text-cyan" />
                <span className="text-[11px] font-medium">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-md border border-warning/30 bg-warning/5 px-3 py-2">
            <span className="text-mono text-[10px] uppercase tracking-wider text-warning">
              Status
            </span>
            <span className="text-xs text-foreground/80">
              Integration scheduled · Q2 deployment window
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

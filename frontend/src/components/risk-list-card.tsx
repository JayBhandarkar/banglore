import { TrendingUp } from "lucide-react";
import { Panel } from "./panel";
import type { RiskItem } from "@/lib/types";

const levelColor: Record<RiskItem["level"], string> = {
  Low: "bg-primary",
  Medium: "bg-cyan",
  High: "bg-warning",
  Critical: "bg-destructive",
};
const levelText: Record<RiskItem["level"], string> = {
  Low: "text-primary",
  Medium: "text-cyan",
  High: "text-warning",
  Critical: "text-destructive",
};

export function RiskListCard({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: RiskItem[];
}) {
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      badge={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />}
    >
      <ul className="flex flex-col">
        {items.slice(0, 6).map((it, idx) => (
          <li
            key={it.name}
            className="flex items-center gap-3 border-b border-border/60 py-2 last:border-0"
          >
            <span className="text-mono text-[10px] tabular-nums text-muted-foreground">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{it.name}</p>
              <p className="text-mono text-[9px] uppercase text-muted-foreground">{it.zone}</p>
            </div>
            <div className="flex w-24 items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={`h-full ${levelColor[it.level]}`}
                  style={{ width: `${it.riskScore}%` }}
                />
              </div>
              <span
                className={`w-7 text-right text-mono text-[10px] font-semibold tabular-nums ${levelText[it.level]}`}
              >
                {it.riskScore}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

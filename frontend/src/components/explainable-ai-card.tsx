import { Brain } from "lucide-react";
import { Panel } from "./panel";
import { FEATURE_IMPORTANCE } from "@/lib/mock-data";
import { motion } from "framer-motion";

export function ExplainableAICard() {
  return (
    <Panel
      title="Explainable AI"
      subtitle="Feature importance · SHAP"
      badge={
        <span className="flex items-center gap-1 rounded-md border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-mono text-[10px] uppercase text-cyan">
          <Brain className="h-3 w-3" /> Model
        </span>
      }
    >
      <ul className="flex flex-col gap-2.5">
        {FEATURE_IMPORTANCE.map((f, i) => (
          <li key={f.feature} className="flex items-center gap-3">
            <span className="w-28 truncate text-xs text-foreground/90">{f.feature}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${f.importance * 100}%` }}
                transition={{ duration: 0.9, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-[var(--grad-primary)]"
              />
            </div>
            <span className="w-10 text-right text-mono text-[10px] tabular-nums text-muted-foreground">
              {(f.importance * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

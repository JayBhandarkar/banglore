"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles, AlertTriangle } from "lucide-react";

import { eventStore } from "@/lib/event-store";
import { predictTrafficImpact } from "@/lib/api";
import { DEFAULT_EVENT } from "@/lib/mock-data";
import type { PredictionResult } from "@/lib/types";

const STEPS = [
  "Analyzing Event Characteristics",
  "Comparing Historical Events",
  "Forecasting Traffic Impact",
  "Identifying High-Risk Corridors",
  "Identifying High-Risk Junctions",
  "Generating Resource Allocation Plan",
  "Creating Diversion Strategy",
];

export default function ProcessingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentEvent = eventStore.get().event;
    if (!currentEvent) {
      eventStore.ensureDemo();
      currentEvent = eventStore.get().event || DEFAULT_EVENT;
    }

    const event = currentEvent;

    // Animation interval
    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length));
    }, 320);

    let isDone = false;
    let apiResult: PredictionResult | null = null;

    // Trigger API call
    predictTrafficImpact(event)
      .then((prediction) => {
        apiResult = prediction;
        if (isDone) {
          eventStore.setPrediction(event, prediction);
          router.push("/command-center");
        }
      })
      .catch((err) => {
        console.error("Prediction failed:", err);
        setError(
          "Could not connect to the backend API. Please make sure the FastAPI server is running on http://localhost:8000.",
        );
      });

    const done = setTimeout(() => {
      isDone = true;
      if (apiResult) {
        eventStore.setPrediction(event, apiResult);
        router.push("/command-center");
      }
    }, 2600);

    return () => {
      clearInterval(interval);
      clearTimeout(done);
    };
  }, [router]);

  if (error) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.63_0.19_258/0.18),transparent_60%)]" />
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl p-7 border-destructive/30 bg-destructive/5"
        >
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-display text-xl font-semibold">Backend Connection Failed</h2>
          </div>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{error}</p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-[var(--grad-primary)] px-4 py-2 text-xs font-semibold text-white shadow-md hover:opacity-90"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded-md border border-border bg-surface/50 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface"
            >
              Back to Console
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.63_0.19_258/0.18),transparent_60%)]" />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong relative w-full max-w-xl overflow-hidden rounded-2xl p-7"
      >
        <div className="flex items-center gap-3">
          <div className="relative grid h-12 w-12 place-items-center rounded-xl bg-[var(--grad-primary)] glow-primary">
            <Sparkles className="h-5 w-5 text-white" />
            <motion.span
              className="absolute inset-0 rounded-xl border-2 border-primary/60"
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          </div>
          <div className="leading-tight">
            <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
              BTP-Predict v2.3
            </p>
            <h2 className="text-display text-xl font-semibold">Running event-driven inference</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cross-referencing 24 months of incident telemetry, corridor flow models, and resource
              registries.
            </p>
          </div>
        </div>

        <ol className="mt-6 flex flex-col gap-2">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 rounded-md border px-3 py-2 transition ${
                  done
                    ? "border-success/30 bg-success/5"
                    : active
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-surface/40"
                }`}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full border border-current">
                  <AnimatePresence mode="wait">
                    {done ? (
                      <motion.span
                        key="ok"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-success"
                      >
                        <Check className="h-3 w-3" />
                      </motion.span>
                    ) : active ? (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </AnimatePresence>
                </span>
                <span
                  className={`text-sm ${done ? "text-foreground/80" : active ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {label}
                </span>
                {active && (
                  <span className="ml-auto text-mono text-[10px] uppercase tracking-wider text-primary">
                    Running…
                  </span>
                )}
                {done && (
                  <span className="ml-auto text-mono text-[10px] uppercase tracking-wider text-success">
                    OK
                  </span>
                )}
              </motion.li>
            );
          })}
        </ol>

        <div className="mt-5 h-1 overflow-hidden rounded-full bg-border">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / STEPS.length) * 100}%` }}
            transition={{ ease: "easeOut" }}
            className="h-full bg-[var(--grad-primary)]"
          />
        </div>
        <p className="mt-2 text-center text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Compiling Command Center…
        </p>
      </motion.div>
    </div>
  );
}

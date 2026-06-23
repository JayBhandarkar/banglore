"use client";

import { useEffect, useState, useMemo } from "react";
import { Beaker, Play, RotateCcw, Loader2 } from "lucide-react";

import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImpactPredictionCard } from "@/components/impact-prediction-card";
import { ResourceRecommendationCard } from "@/components/resource-recommendation-card";
import { ResourceOptimizationSection } from "@/components/resource-optimization-section";

import {
  DEFAULT_EVENT,
  EVENT_CAUSES,
  EVENT_TYPES,
  ZONES,
  generatePrediction,
} from "@/lib/mock-data";
import type { EventData, PredictionResult } from "@/lib/types";
import { predictTrafficImpact } from "@/lib/api";

export default function Simulator() {
  const [data, setData] = useState<EventData>({
    ...DEFAULT_EVENT,
    eventType: "Festival",
    zone: "CBD",
    priority: "High",
    roadClosure: "Yes",
  });
  const [prediction, setPrediction] = useState<PredictionResult>(
    generatePrediction({
      ...DEFAULT_EVENT,
      eventType: "Festival",
      zone: "CBD",
      priority: "High",
      roadClosure: "Yes",
    }),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async (eventData: EventData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictTrafficImpact(eventData);
      setPrediction(res);
    } catch (err) {
      console.error("Simulation failed, falling back to mock prediction:", err);
      setError("Backend API offline. Using fallback simulation.");
      setPrediction(generatePrediction(eventData));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation(data);
  }, []);

  const upd = <K extends keyof EventData>(k: K, v: EventData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Event Simulator"
        subtitle="Hypothetical scenario modeling"
        badge={
          <span className="flex items-center gap-1 rounded-md border border-cyan/40 bg-cyan/10 px-2 py-0.5 text-mono text-[10px] uppercase text-cyan">
            <Beaker className="h-3 w-3" /> Sandbox
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Event Type">
            <Input
              value={data.eventType}
              onChange={(e) => upd("eventType", e.target.value)}
              disabled={loading}
              className="h-9 border-border bg-surface text-sm"
              placeholder="e.g. Festival, VIP Movement"
            />
          </Field>
          <Field label="Cause">
            <Input
              value={data.eventCause}
              onChange={(e) => upd("eventCause", e.target.value)}
              disabled={loading}
              className="h-9 border-border bg-surface text-sm"
              placeholder="e.g. Religious Procession"
            />
          </Field>
          <Field label="Zone">
            <Input
              value={data.zone}
              onChange={(e) => upd("zone", e.target.value)}
              disabled={loading}
              className="h-9 border-border bg-surface text-sm"
              placeholder="e.g. CBD, East, South"
            />
          </Field>
          <Field label="Road Closure">
            <Select
              value={data.roadClosure}
              onValueChange={(v) => upd("roadClosure", v as "Yes" | "No")}
              disabled={loading}
            >
              <SelectTrigger className="h-9 border-border bg-surface text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => runSimulation(data)}
            disabled={loading}
            className="bg-[var(--grad-primary)] text-white"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {loading ? "Simulating..." : "Simulate Impact"}
          </Button>
          <Button
            variant="outline"
            className="border-border bg-surface"
            onClick={() => {
              setData(DEFAULT_EVENT);
              runSimulation(DEFAULT_EVENT);
            }}
            disabled={loading}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          {error && (
            <span className="text-[10px] uppercase text-destructive font-semibold ml-2">
              {error}
            </span>
          )}
          {!error && (
            <span className="ml-auto text-mono text-[10px] uppercase text-muted-foreground">
              {loading
                ? "Executing model inference..."
                : "Telemetry synced · " + new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ImpactPredictionCard p={prediction} />
        <ResourceRecommendationCard p={prediction} />
      </div>

      <ResourceOptimizationSection p={prediction} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// silence unused import warning for Input in some configs
void Input;

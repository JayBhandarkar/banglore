"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { MapboxMap } from "@/components/mapbox-map";

import { eventStore } from "@/lib/event-store";
import { DEFAULT_EVENT } from "@/lib/mock-data";
import {
  CORRIDORS,
  EVENT_CAUSES,
  EVENT_TYPES,
  JUNCTIONS,
  VEHICLE_TYPES,
  ZONES,
} from "@/lib/mock-data";
import type { EventData } from "@/lib/types";

export default function EventAnalysisPage() {
  const router = useRouter();
  const existing = eventStore.get().event;
  const [data, setData] = useState<EventData>(() => {
    const ev = { ...(existing ?? DEFAULT_EVENT) };

    // Set priority to default "High" if missing
    if (!ev.priority) {
      ev.priority = "High";
    }

    // Set dayOfWeek and month if missing
    if (!ev.dayOfWeek) {
      ev.dayOfWeek = "Friday";
    }
    if (!ev.month) {
      ev.month = "Nov";
    }

    // Format startTime as YYYY-MM-DDTHH:MM for datetime-local
    if (ev.startTime) {
      if (!ev.startTime.includes("-")) {
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        ev.startTime = `${dateStr}T${ev.startTime}`;
      }
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      ev.startTime = now.toISOString().slice(0, 16);
    }
    return ev;
  });

  const update = <K extends keyof EventData>(k: K, v: EventData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    eventStore.setEvent(data);
    router.push("/processing");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background city network */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <MapboxMap className="h-full w-full" showOverlays />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,oklch(0.10_0.022_252/0.85)_70%,oklch(0.07_0.018_252)_100%)]" />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-20" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-start gap-6 px-4 py-8 lg:py-12">
        {/* Brand bar */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--grad-primary)] glow-primary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-display text-sm font-semibold">TrafficOS</p>
              <p className="text-mono text-[10px] uppercase text-muted-foreground">
                Bengaluru Traffic Police · Smart City Authority
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-border bg-surface/70 px-2.5 py-1 backdrop-blur md:flex">
            <span className="status-dot" />
            <span className="text-mono text-[10px] uppercase text-muted-foreground">
              Network · Live
            </span>
          </div>
        </motion.div>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-strong w-full overflow-hidden rounded-2xl"
        >
          <div className="border-b border-border bg-[radial-gradient(circle_at_top,oklch(0.63_0.19_258/0.18),transparent_60%)] px-6 py-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
                  Event Intelligence Console
                </p>
                <h1 className="text-display mt-1 text-3xl font-bold tracking-tight md:text-4xl">
                  Event-Driven Traffic Intelligence
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Forecast congestion impact before it happens. Configure the event, pick a
                  location, and TrafficOS will model deployment, barricading, and diversion
                  strategy.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface/70 px-3 py-1.5">
                <span className="text-mono text-[10px] uppercase text-muted-foreground">Model</span>
                <span className="text-mono text-xs font-semibold text-foreground">
                  BTP-Predict v2.3
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_460px]">
            {/* Form fields */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Event Type">
                <Input
                  value={data.eventType}
                  onChange={(e) => update("eventType", e.target.value)}
                  className="h-9 border-border bg-surface text-sm"
                  placeholder="e.g. Festival, VIP Movement, Accident"
                />
              </Field>
              <Field label="Event Cause">
                <Input
                  value={data.eventCause}
                  onChange={(e) => update("eventCause", e.target.value)}
                  className="h-9 border-border bg-surface text-sm"
                  placeholder="e.g. Religious Procession, Road Work"
                />
              </Field>
              <Field label="Road Closure Required">
                <SelectInput
                  value={data.roadClosure}
                  onChange={(v) => update("roadClosure", v as "Yes" | "No")}
                  options={["Yes", "No"]}
                />
              </Field>
              <Field label="Vehicle Type">
                <Input
                  value={data.vehicleType}
                  onChange={(e) => update("vehicleType", e.target.value)}
                  className="h-9 border-border bg-surface text-sm"
                  placeholder="e.g. Mixed Traffic, Public Transit"
                />
              </Field>
              <Field label="Corridor">
                <Input
                  value={data.corridor}
                  onChange={(e) => update("corridor", e.target.value)}
                  className="h-9 border-border bg-surface text-sm"
                  placeholder="e.g. Outer Ring Road, MG Road Corridor"
                />
              </Field>
              <Field label="Zone">
                <Input
                  value={data.zone}
                  onChange={(e) => update("zone", e.target.value)}
                  className="h-9 border-border bg-surface text-sm"
                  placeholder="e.g. CBD, East, West, South"
                />
              </Field>
              <Field label="Junction">
                <Input
                  value={data.junction}
                  onChange={(e) => update("junction", e.target.value)}
                  className="h-9 border-border bg-surface text-sm"
                  placeholder="e.g. Silk Board Junction, Trinity Circle"
                />
              </Field>
              <Field label="Event Start Date & Time">
                <Input
                  type="datetime-local"
                  value={data.startTime}
                  onChange={(e) => update("startTime", e.target.value)}
                  className="h-9 border-border bg-surface text-sm"
                />
              </Field>
            </div>

            {/* Map picker */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Location Selection
                </Label>
                <span className="flex items-center gap-1 text-mono text-[10px] text-cyan">
                  <MapPin className="h-3 w-3" /> Click map to set
                </span>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-border bg-surface h-[320px] lg:h-[420px]">
                <MapboxMap
                  className="absolute inset-0 h-full w-full"
                  interactive
                  selected={{ lng: data.lng, lat: data.lat }}
                  onPick={(lng, lat) => setData((d) => ({ ...d, lng, lat }))}
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-md border border-border bg-background/85 px-2.5 py-1.5 backdrop-blur">
                  <span className="text-mono text-[10px] uppercase text-muted-foreground">
                    Selected
                  </span>
                  <span className="text-mono text-xs font-semibold tabular-nums">
                    {data.lat.toFixed(4)}°N · {data.lng.toFixed(4)}°E
                  </span>
                </div>
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full bg-[var(--grad-primary)] text-base font-semibold text-white shadow-[var(--shadow-glow-primary)] transition hover:opacity-95"
              >
                Analyze Traffic Impact
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-mono text-[10px] uppercase text-muted-foreground">
                ML inference · ~2.4s · 17 features
              </p>
            </div>
          </form>
        </motion.div>

        <p className="text-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          © Bengaluru Traffic Police · Smart City Operations · Internal Use
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 border-border bg-surface text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-border bg-popover">
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-sm">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

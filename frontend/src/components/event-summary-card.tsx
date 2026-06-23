import { Pencil, MapPin, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Panel } from "./panel";
import { Button } from "@/components/ui/button";
import type { EventData } from "@/lib/types";

const priorityColor: Record<EventData["priority"], string> = {
  Low: "text-primary border-primary/40 bg-primary/10",
  Medium: "text-cyan border-cyan/40 bg-cyan/10",
  High: "text-warning border-warning/40 bg-warning/10",
  Critical: "text-destructive border-destructive/40 bg-destructive/10",
};

export function EventSummaryCard({ event }: { event: EventData }) {
  const rows: Array<[string, string]> = [
    ["Event Type", event.eventType],
    ["Cause", event.eventCause],
    ["Corridor", event.corridor],
    ["Zone", event.zone],
    ["Junction", event.junction],
    ["Start Time", `${event.dayOfWeek} · ${event.startTime}`],
  ];

  return (
    <Panel
      title="Current Event"
      subtitle="Active Scenario"
      badge={
        <span
          className={`rounded-md border px-2 py-0.5 text-mono text-[10px] uppercase tracking-wider ${priorityColor[event.priority]}`}
        >
          {event.priority} Priority
        </span>
      }
    >
      <div className="flex items-start gap-2 rounded-lg border border-border bg-surface/60 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="flex-1 leading-tight">
          <p className="text-display text-sm font-semibold text-foreground">{event.eventCause}</p>
          <p className="mt-0.5 flex items-center gap-1 text-mono text-[10px] uppercase text-muted-foreground">
            <MapPin className="h-3 w-3" /> {event.lat.toFixed(4)}°N · {event.lng.toFixed(4)}°E
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col">
            <dt className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {k}
            </dt>
            <dd className="truncate text-xs font-medium text-foreground">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-surface/60 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-cyan" />
          <span className="text-mono text-[10px] uppercase text-muted-foreground">
            Road Closure
          </span>
        </div>
        <span
          className={`text-mono text-[10px] font-semibold uppercase ${event.roadClosure === "Yes" ? "text-destructive" : "text-success"}`}
        >
          {event.roadClosure}
        </span>
      </div>

      <Button
        asChild
        size="sm"
        variant="outline"
        className="mt-3 w-full border-border bg-surface hover:bg-accent"
      >
        <Link href="/">
          <Pencil className="h-3.5 w-3.5" /> Edit Event
        </Link>
      </Button>
    </Panel>
  );
}

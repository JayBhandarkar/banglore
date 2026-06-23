"use client";

import {
  BarChart,
  Bar,
  Cell,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { AlertTriangle, UserCheck, Shield, Clock } from "lucide-react";
import { Panel } from "./panel";
import { useBackendData } from "@/hooks/use-backend-data";
import { HistoryItem } from "@/lib/api";
import {
  CAUSE_DISTRIBUTION,
  IMPACT_DISTRIBUTION,
  MONTHLY_TREND,
  PLANNED_VS_UNPLANNED,
} from "@/lib/mock-data";

const axis = { stroke: "oklch(0.68 0.025 250)", fontSize: 10, fontFamily: "JetBrains Mono" };
const grid = "oklch(1 0 0 / 0.06)";

const tooltipStyle = {
  background: "oklch(0.20 0.028 252)",
  border: "1px solid oklch(1 0 0 / 0.12)",
  borderRadius: 8,
  fontSize: 11,
  fontFamily: "JetBrains Mono",
  color: "oklch(0.96 0.005 250)",
  padding: "6px 10px",
};

export function AnalyticsSection() {
  const { analytics, history, loading } = useBackendData();

  // Map Cause Distribution
  const hasCauseData = analytics && Object.keys(analytics.cause_distribution || {}).length > 0;
  const causeData = hasCauseData
    ? Object.entries(analytics!.cause_distribution).map(([cause, count]) => ({
        cause: cause.charAt(0).toUpperCase() + cause.slice(1).replace("_", " "),
        count,
      }))
    : CAUSE_DISTRIBUTION;

  // Map Impact Distribution
  const hasImpactData = analytics && Object.keys(analytics.severity_distribution || {}).length > 0;
  const impactData = hasImpactData
    ? [
        { level: "Low", value: analytics!.severity_distribution.Low || 0 },
        { level: "Medium", value: analytics!.severity_distribution.Medium || 0 },
        { level: "High", value: analytics!.severity_distribution.High || 0 },
        { level: "Critical", value: analytics!.severity_distribution.Critical || 0 },
      ]
    : IMPACT_DISTRIBUTION;

  // Compute dynamic last 6 months trend & type ratios if history has enough data
  const getEventDate = (item: HistoryItem) => {
    const dateStr = item.start_datetime || item.created_at;
    if (!dateStr) return null;
    try {
      return new Date(dateStr);
    } catch (e) {
      return null;
    }
  };

  // Dynamically find the maximum date in the historical records to align charts with the dataset timeline
  let referenceDate = new Date();
  if (history.length > 0) {
    let latestTime = 0;
    history.forEach((item) => {
      const d = getEventDate(item);
      if (d) {
        const t = d.getTime();
        if (t > latestTime) latestTime = t;
      }
    });
    if (latestTime > 0) {
      referenceDate = new Date(latestTime);
    }
  }

  const last6Months = Array.from({ length: 6 })
    .map((_, i) => {
      const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
      return {
        monthStr: d.toLocaleString("default", { month: "short" }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
      };
    })
    .reverse();

  const plannedVsUnplannedData = last6Months.map(({ monthStr, year, monthIndex }) => {
    const eventsInMonth = history.filter((item) => {
      const d = getEventDate(item);
      return d && d.getMonth() === monthIndex && d.getFullYear() === year;
    });

    const plannedCount = eventsInMonth.filter(
      (item) => (item.event_type || "").toLowerCase() === "planned",
    ).length;
    const unplannedCount = eventsInMonth.filter(
      (item) => (item.event_type || "").toLowerCase() === "unplanned",
    ).length;

    return {
      month: monthStr,
      planned: plannedCount,
      unplanned: unplannedCount,
    };
  });

  const monthlyTrendData = last6Months.map(({ monthStr, year, monthIndex }) => {
    const eventsInMonth = history.filter((item) => {
      const d = getEventDate(item);
      return d && d.getMonth() === monthIndex && d.getFullYear() === year;
    });

    const eventsCount = eventsInMonth.length;
    const totalImpact = eventsInMonth.reduce((sum, item) => sum + (item.impact_score || 0), 0);
    const avgImpact = eventsCount > 0 ? Math.round(totalImpact / eventsCount) : 0;

    return {
      month: monthStr,
      events: eventsCount,
      impact: avgImpact,
    };
  });

  const useFallback = history.length < 2;
  const plannedVsUnplanned = useFallback ? PLANNED_VS_UNPLANNED : plannedVsUnplannedData;
  const monthlyTrend = useFallback ? MONTHLY_TREND : monthlyTrendData;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          title="Total Incidents Tracked"
          value={loading ? "..." : (analytics?.total_events ?? 0)}
          desc="Simulated and logged events"
          icon={<AlertTriangle className="h-4 w-4 text-[oklch(0.78_0.16_75)]" />}
        />
        <KpiCard
          title="Police Personnel Allocated"
          value={loading ? "..." : (analytics?.allocated_police ?? 0)}
          desc="Active field officer capacity"
          icon={<UserCheck className="h-4 w-4 text-[oklch(0.63_0.19_258)]" />}
        />
        <KpiCard
          title="Barricades Deployed"
          value={loading ? "..." : (analytics?.allocated_barricades ?? 0)}
          desc="Physical traffic barriers placed"
          icon={<Shield className="h-4 w-4 text-[oklch(0.74_0.13_207)]" />}
        />
        <KpiCard
          title="Avg Incident Duration"
          value={loading ? "..." : `${analytics?.avg_duration ?? 0}m`}
          desc="Average time to clear road flow"
          icon={<Clock className="h-4 w-4 text-purple-400" />}
        />
      </div>

      {/* Recharts Graphs */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <Panel title="Planned vs Unplanned" subtitle="Last 6 months">
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart
                data={plannedVsUnplanned}
                margin={{ top: 8, right: 4, bottom: 0, left: -20 }}
              >
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                <Bar
                  dataKey="planned"
                  stackId="a"
                  fill="oklch(0.63 0.19 258)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="unplanned"
                  stackId="a"
                  fill="oklch(0.74 0.13 207)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend
            items={[
              ["Planned", "oklch(0.63 0.19 258)"],
              ["Unplanned", "oklch(0.74 0.13 207)"],
            ]}
          />
        </Panel>

        <Panel title="Event Cause Distribution" subtitle="By incident type">
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart
                layout="vertical"
                data={causeData}
                margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
              >
                <CartesianGrid stroke={grid} horizontal={false} />
                <XAxis type="number" {...axis} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="cause"
                  {...axis}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                <Bar
                  dataKey="count"
                  fill="oklch(0.63 0.19 258)"
                  radius={[0, 3, 3, 0]}
                  barSize={10}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Monthly Event Trends" subtitle="Events vs avg impact">
          <div className="h-44">
            <ResponsiveContainer>
              <AreaChart data={monthlyTrend} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="ev1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.63 0.19 258)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.63 0.19 258)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke="oklch(0.63 0.19 258)"
                  fill="url(#ev1)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="impact"
                  stroke="oklch(0.78 0.16 75)"
                  strokeWidth={2}
                  dot={false}
                />
                <ReferenceLine y={70} stroke="oklch(0.66 0.22 25 / 0.6)" strokeDasharray="3 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Legend
            items={[
              ["Events", "oklch(0.63 0.19 258)"],
              ["Impact", "oklch(0.78 0.16 75)"],
            ]}
          />
        </Panel>

        <Panel title="Impact Distribution" subtitle="Severity breakdown">
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={impactData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid stroke={grid} vertical={false} />
                <XAxis dataKey="level" {...axis} tickLine={false} axisLine={false} />
                <YAxis {...axis} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(1 0 0 / 0.04)" }} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {impactData.map((d, i) => {
                    const colors = [
                      "oklch(0.63 0.19 258)",
                      "oklch(0.74 0.13 207)",
                      "oklch(0.78 0.16 75)",
                      "oklch(0.66 0.22 25)",
                    ];
                    return <Cell key={d.level} fill={colors[i]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      {items.map(([l, c]) => (
        <span
          key={l}
          className="flex items-center gap-1.5 text-mono text-[10px] uppercase text-muted-foreground"
        >
          <span className="h-2 w-2 rounded-sm" style={{ background: c }} /> {l}
        </span>
      ))}
    </div>
  );
}

interface KpiProps {
  title: string;
  value: string | number;
  desc: string;
  icon: React.ReactNode;
}

function KpiCard({ title, value, desc, icon }: KpiProps) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="grid h-7 w-7 place-items-center rounded-md border border-border bg-surface/60">
          {icon}
        </div>
      </div>
      <p className="text-display mt-2 text-2xl font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-2 text-[9px] text-muted-foreground">{desc}</p>
    </div>
  );
}

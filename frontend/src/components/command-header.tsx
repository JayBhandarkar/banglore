import { useEffect, useState } from "react";
import { Search, Cloud, Bell, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";

export function CommandHeader() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-xl">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <div className="hidden items-center gap-2 md:flex">
        <span className="status-dot" />
        <span className="text-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Live · BTP Control · Bengaluru
        </span>
      </div>

      <div className="ml-auto flex flex-1 items-center justify-end gap-2 md:gap-3">
        <div className="relative hidden w-72 md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search corridor, junction, event…"
            className="h-8 border-border bg-surface pl-8 text-xs"
          />
        </div>

        <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 md:flex">
          <Cloud className="h-3.5 w-3.5 text-cyan" />
          <span className="text-xs font-medium">26°C</span>
          <span className="text-mono text-[10px] uppercase text-muted-foreground">
            Partly Cloudy
          </span>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5">
          <span className="text-mono text-xs tabular-nums">
            {now
              ? now.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
              : "--:--:--"}
          </span>
          <span className="text-mono text-[10px] uppercase text-muted-foreground hidden lg:inline">
            {now
              ? now.toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })
              : ""}
          </span>
        </div>

        <button className="relative grid h-8 w-8 place-items-center rounded-md border border-border bg-surface text-muted-foreground transition hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-destructive text-mono text-[8px] font-bold text-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--grad-primary)]">
            <User className="h-3 w-3 text-white" />
          </div>
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-xs font-medium">DCP A. Rao</span>
            <span className="text-mono text-[9px] uppercase text-muted-foreground">Ops Lead</span>
          </div>
        </div>
      </div>
    </header>
  );
}

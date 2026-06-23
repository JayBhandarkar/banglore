"use client";

import { Panel } from "@/components/panel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="Operator" subtitle="Profile & access">
        <div className="flex flex-col gap-3">
          <Field label="Display Name">
            <Input defaultValue="DCP A. Rao" className="h-9 border-border bg-surface" />
          </Field>
          <Field label="Badge ID">
            <Input defaultValue="BTP-1042" className="h-9 border-border bg-surface" />
          </Field>
          <Field label="Operations Cell">
            <Input defaultValue="BLR-Central-01" className="h-9 border-border bg-surface" />
          </Field>
        </div>
      </Panel>
      <Panel title="System" subtitle="Telemetry & alerts">
        <div className="flex flex-col gap-3">
          {[
            ["Live network telemetry", true],
            ["Auto-mobilize on Critical", true],
            ["Notify on diversion change", true],
            ["Phase 2 CCTV preview", false],
          ].map(([l, v]) => (
            <div
              key={l as string}
              className="flex items-center justify-between rounded-md border border-border bg-surface/60 px-3 py-2"
            >
              <span className="text-sm">{l}</span>
              <Switch defaultChecked={v as boolean} />
            </div>
          ))}
          <Button className="mt-2 bg-[var(--grad-primary)] text-white">Save Configuration</Button>
        </div>
      </Panel>
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

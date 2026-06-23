"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandHeader } from "@/components/command-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <CommandHeader />
          <main className="min-w-0 flex-1 overflow-x-hidden p-4 lg:p-5">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

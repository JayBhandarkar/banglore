import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Beaker,
  Map as MapIcon,
  Users,
  FileBarChart,
  Settings,
  Brain,
  Camera,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const primary = [
  { title: "Command Center", url: "/command-center", icon: LayoutDashboard },
  { title: "Event Simulator", url: "/simulator", icon: Beaker },
  { title: "Risk Map", url: "/risk-map", icon: MapIcon },
  { title: "Resource Planner", url: "/resource-planner", icon: Users },
  { title: "Reports", url: "/reports", icon: FileBarChart },
];

const phase2 = [
  { title: "AI Traffic Advisor", icon: Brain },
  { title: "CCTV Intelligence", icon: Camera },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="relative grid h-8 w-8 place-items-center rounded-md bg-[var(--grad-primary)] glow-primary">
            <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-display text-[15px] font-semibold tracking-tight">
                TrafficOS
              </span>
              <span className="text-mono text-[10px] uppercase text-muted-foreground">
                Smart City · v1.0
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-mono text-[10px] uppercase tracking-widest">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primary.map((item) => {
                const active = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={item.url} className="flex items-center gap-2.5">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span className="text-sm">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="panel-divider mx-3 my-2" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-mono text-[10px] uppercase tracking-widest">
            Phase 2 · Coming Soon
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {phase2.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton disabled className="opacity-55">
                    <item.icon className="h-4 w-4" />
                    {!collapsed && (
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm">{item.title}</span>
                        <span className="rounded-sm bg-warning/15 px-1.5 py-0.5 text-mono text-[9px] uppercase text-warning">
                          Soon
                        </span>
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="panel-divider mx-3 my-2" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                  <Link href="/settings" className="flex items-center gap-2.5">
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span className="text-sm">Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-2 py-2">
            <div className="flex items-center gap-2 rounded-md bg-sidebar-accent/60 px-2.5 py-2">
              <span className="status-dot" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs font-medium">Live · BTP Ops</span>
                <span className="text-mono text-[10px] text-muted-foreground">Node BLR-01</span>
              </div>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

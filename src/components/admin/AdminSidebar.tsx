import { useAuth } from "@/contexts/AuthContext";
import { useStaffPermissions, type Permission } from "@/hooks/useStaffPermissions";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, CreditCard, Users, BarChart3, Barcode, UserPlus, Bot, LogOut,
  FileCheck, Plane, UserCog, Landmark, Activity, FilePenLine, HeadphonesIcon, Shield,
  MessageSquare, ClipboardList, Settings, ChevronDown,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  permission?: Permission;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

const flatItems: MenuItem[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, permission: "overview" },
  { title: "Packages", url: "/admin/packages", icon: Package, permission: "packages" },
  { title: "Payments", url: "/admin/payments", icon: CreditCard, permission: "payments" },
  { title: "Pilgrims", url: "/admin/pilgrims", icon: Users, permission: "pilgrims" },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3, permission: "analytics" },
  { title: "ID Tags", url: "/admin/id-tags", icon: Barcode, permission: "id_tags" },
];

const collapsibleGroups: MenuGroup[] = [
  {
    label: "Documents",
    icon: FileCheck,
    items: [
      { title: "Visa Management", url: "/admin/visa-management", icon: FileCheck, permission: "visa_management" },
      { title: "Flight Tickets", url: "/admin/flight-tickets", icon: Plane, permission: "flight_tickets" },
    ],
  },
  {
    label: "Agents",
    icon: UserCog,
    items: [
      { title: "Agents List", url: "/admin/agents", icon: UserCog, permission: "agents" },
      { title: "Applications", url: "/admin/agent-applications", icon: UserPlus, permission: "agent_applications" },
      { title: "Agent Wallets", url: "/admin/agent-wallets", icon: Landmark, permission: "agent_wallets" },
    ],
  },
  {
    label: "Operations",
    icon: Activity,
    items: [
      { title: "Bank Accounts", url: "/admin/bank-accounts", icon: Landmark, permission: "bank_accounts" },
      { title: "Activity Log", url: "/admin/activity-log", icon: Activity, permission: "activity_log" },
      { title: "Amendments", url: "/admin/amendments", icon: FilePenLine, permission: "amendments" },
      { title: "Support Tickets", url: "/admin/support-tickets", icon: HeadphonesIcon, permission: "support_tickets" },
    ],
  },
  {
    label: "System",
    icon: Shield,
    items: [
      { title: "Staff Management", url: "/admin/staff-management", icon: Shield, permission: "staff_management" },
      { title: "Team Chat", url: "/admin/team-chat", icon: MessageSquare, permission: "team_chat" },
      { title: "Booking Form", url: "/admin/booking-form", icon: ClipboardList, permission: "booking_form" },
      { title: "AI Assistant", url: "/admin/ai-assistant", icon: Bot, permission: "ai_assistant" },
      { title: "Settings", url: "/admin/settings", icon: Settings, permission: "settings" },
    ],
  },
];

const CollapsibleGroup = ({
  group,
  hasPermission,
  pathname,
}: {
  group: MenuGroup;
  hasPermission: (p: Permission) => boolean;
  pathname: string;
}) => {
  const visibleItems = group.items.filter((i) => !i.permission || hasPermission(i.permission));
  const hasActiveChild = visibleItems.some((i) => pathname === i.url || pathname.startsWith(i.url + "/"));
  const [open, setOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  if (visibleItems.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors group">
        <span className="flex items-center gap-3">
          <group.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{group.label}</span>
        </span>
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
          open && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-0.5">
        <div className="ml-4 pl-3 border-l-2 border-border/60 space-y-0.5">
          {visibleItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={false}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              activeClassName="bg-primary/8 text-primary font-medium"
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

const AdminSidebar = () => {
  const { profile, signOut } = useAuth();
  const { hasPermission } = useStaffPermissions();
  const location = useLocation();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  const visibleFlat = flatItems.filter((i) => !i.permission || hasPermission(i.permission));

  return (
    <Sidebar className="border-r border-border bg-card">
      {/* Brand */}
      <div className="p-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <img src="https://i.ibb.co/C3zkfpVR/Rauda-Logo-2-PNG.png" alt="Raudah" className="h-6 w-auto brightness-0 invert" />
          </div>
          <div>
            <span className="font-heading text-sm font-semibold text-foreground">Raudah Admin</span>
            <span className="block text-[11px] text-muted-foreground">Management Console</span>
          </div>
        </div>
      </div>

      <SidebarContent className="px-2 py-3">
        <ScrollArea className="flex-1">
          {/* Flat links */}
          <div className="space-y-0.5 mb-3">
            {visibleFlat.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/admin"}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-muted/60 hover:text-foreground transition-colors"
                activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[1px]"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-3 mb-3" />

          {/* Collapsible groups */}
          <div className="space-y-1">
            {collapsibleGroups.map((group) => (
              <CollapsibleGroup
                key={group.label}
                group={group}
                hasPermission={hasPermission}
                pathname={location.pathname}
              />
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border p-3">
        <div className="flex items-center gap-3 mb-2 px-1">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.full_name || "Admin"}</p>
            <p className="text-[11px] text-muted-foreground">Administrator</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;

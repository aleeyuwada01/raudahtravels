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
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-3 rounded-xl text-[17px] font-medium text-[hsl(0,0%,25%)] hover:bg-[hsl(0,0%,94%)] transition-colors cursor-pointer">
        <span className="flex items-center gap-4">
          <group.icon className="h-[22px] w-[22px] shrink-0 text-[hsl(0,0%,45%)]" />
          <span>{group.label}</span>
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-[hsl(0,0%,55%)] transition-transform duration-200",
          open && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="relative ml-[26px] mt-0.5 mb-1">
          {/* Vertical connector line */}
          <div className="absolute left-0 top-0 bottom-3 w-px bg-[hsl(0,0%,82%)]" />
          <div className="space-y-0.5">
            {visibleItems.map((item, idx) => (
              <div key={item.url} className="relative flex items-center">
                {/* Horizontal connector branch */}
                <div className="absolute left-0 top-1/2 w-4 h-px bg-[hsl(0,0%,82%)]" />
                <NavLink
                  to={item.url}
                  end={false}
                  className="flex items-center w-full ml-6 px-3 py-2.5 rounded-lg text-[16px] text-[hsl(0,0%,45%)] hover:bg-[hsl(0,0%,94%)] hover:text-[hsl(0,0%,15%)] transition-colors"
                  activeClassName="bg-[hsl(40,30%,95%)] text-[hsl(0,0%,10%)] font-semibold shadow-sm"
                >
                  <span>{item.title}</span>
                </NavLink>
              </div>
            ))}
          </div>
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
    <Sidebar className="bg-sidebar" style={{ ["--sidebar-background" as string]: "0 0% 93%", ["--sidebar-foreground" as string]: "0 0% 15%" }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[hsl(0,0%,88%)] flex items-center justify-center shrink-0 border border-[hsl(0,0%,82%)]">
            <img src="https://i.ibb.co/C3zkfpVR/Rauda-Logo-2-PNG.png" alt="Raudah" className="h-6 w-auto opacity-60" />
          </div>
        </div>
      </div>

      <SidebarContent className="px-3 py-1">
        <ScrollArea className="flex-1">
          {/* Flat links */}
          <div className="space-y-0.5 mb-2">
            {visibleFlat.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                end={item.url === "/admin"}
                className="flex items-center gap-4 px-3 py-3 rounded-xl text-[17px] text-[hsl(0,0%,25%)] hover:bg-[hsl(0,0%,94%)] transition-colors"
                activeClassName="bg-[hsl(40,30%,95%)] text-[hsl(0,0%,10%)] font-semibold shadow-sm"
              >
                <item.icon className="h-[22px] w-[22px] shrink-0 text-[hsl(0,0%,45%)]" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>

          {/* Collapsible groups */}
          <div className="space-y-0.5">
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
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-9 w-9 border border-[hsl(0,0%,85%)]">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-[hsl(0,0%,92%)] text-[hsl(0,0%,40%)] text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[hsl(0,0%,15%)] truncate">{profile?.full_name || "Admin"}</p>
            <p className="text-[11px] text-[hsl(0,0%,55%)]">Administrator</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-[hsl(0,0%,50%)] hover:text-destructive hover:bg-destructive/10 h-9">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;

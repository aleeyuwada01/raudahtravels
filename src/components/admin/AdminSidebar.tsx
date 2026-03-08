import { useAuth } from "@/contexts/AuthContext";
import { useStaffPermissions, type Permission } from "@/hooks/useStaffPermissions";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Package, CreditCard, Users, BarChart3, Barcode, UserPlus, Bot, LogOut,
  FileCheck, Plane, UserCog, Landmark, Activity, FilePenLine, HeadphonesIcon, Shield,
  MessageSquare, ClipboardList, Settings,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  permission?: Permission;
}

const mainMenuItems: MenuItem[] = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, permission: "overview" },
  { title: "Packages", url: "/admin/packages", icon: Package, permission: "packages" },
  { title: "Payments", url: "/admin/payments", icon: CreditCard, permission: "payments" },
  { title: "Pilgrims", url: "/admin/pilgrims", icon: Users, permission: "pilgrims" },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3, permission: "analytics" },
  { title: "ID Tags", url: "/admin/id-tags", icon: Barcode, permission: "id_tags" },
];

const documentMenuItems: MenuItem[] = [
  { title: "Visa Management", url: "/admin/visa-management", icon: FileCheck, permission: "visa_management" },
  { title: "Flight Tickets", url: "/admin/flight-tickets", icon: Plane, permission: "flight_tickets" },
];

const agentMenuItems: MenuItem[] = [
  { title: "Agents", url: "/admin/agents", icon: UserCog, permission: "agents" },
  { title: "Agent Applications", url: "/admin/agent-applications", icon: UserPlus, permission: "agent_applications" },
  { title: "Agent Wallets", url: "/admin/agent-wallets", icon: Landmark, permission: "agent_wallets" },
];

const operationsMenuItems: MenuItem[] = [
  { title: "Bank Accounts", url: "/admin/bank-accounts", icon: Landmark, permission: "bank_accounts" },
  { title: "Activity Log", url: "/admin/activity-log", icon: Activity, permission: "activity_log" },
  { title: "Amendments", url: "/admin/amendments", icon: FilePenLine, permission: "amendments" },
  { title: "Support Tickets", url: "/admin/support-tickets", icon: HeadphonesIcon, permission: "support_tickets" },
];

const systemMenuItems: MenuItem[] = [
  { title: "Staff Management", url: "/admin/staff-management", icon: Shield, permission: "staff_management" },
  { title: "Team Chat", url: "/admin/team-chat", icon: MessageSquare, permission: "team_chat" },
  { title: "Booking Form", url: "/admin/booking-form", icon: ClipboardList, permission: "booking_form" },
  { title: "AI Assistant", url: "/admin/ai-assistant", icon: Bot, permission: "ai_assistant" },
  { title: "Settings", url: "/admin/settings", icon: Settings, permission: "settings" },
];

const MenuGroup = ({ label, items, hasPermission }: { label: string; items: MenuItem[]; hasPermission: (p: Permission) => boolean }) => {
  const visible = items.filter((i) => !i.permission || hasPermission(i.permission));
  if (visible.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/admin"}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                  activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm">{item.title}</span>
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

const AdminSidebar = () => {
  const { profile, signOut } = useAuth();
  const { hasPermission } = useStaffPermissions();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "A";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src="https://i.ibb.co/C3zkfpVR/Rauda-Logo-2-PNG.png" alt="Raudah" className="h-8 w-auto brightness-0 invert" />
          <div>
            <span className="font-heading text-sm font-semibold text-sidebar-foreground">Raudah Admin</span>
            <span className="block text-xs text-sidebar-foreground/50">Management Console</span>
          </div>
        </div>
      </div>

      <SidebarContent>
        <ScrollArea className="flex-1">
          <MenuGroup label="Dashboard" items={mainMenuItems} hasPermission={hasPermission} />
          <MenuGroup label="Documents" items={documentMenuItems} hasPermission={hasPermission} />
          <MenuGroup label="Agents" items={agentMenuItems} hasPermission={hasPermission} />
          <MenuGroup label="Operations" items={operationsMenuItems} hasPermission={hasPermission} />
          <MenuGroup label="System" items={systemMenuItems} hasPermission={hasPermission} />
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 border border-sidebar-border">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-sidebar-accent text-sidebar-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.full_name || "Admin"}</p>
            <p className="text-xs text-sidebar-foreground/50">Administrator</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;

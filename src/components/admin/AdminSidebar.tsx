import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Package,
  CreditCard,
  Users,
  BarChart3,
  Barcode,
  UserPlus,
  Bot,
  LogOut,
  FileCheck,
  Plane,
  UserCog,
  Landmark,
  Activity,
  FilePenLine,
  HeadphonesIcon,
  Shield,
  MessageSquare,
  ClipboardList,
  Settings,
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

const mainMenuItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Packages", url: "/admin/packages", icon: Package },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Pilgrims", url: "/admin/pilgrims", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "ID Tags", url: "/admin/id-tags", icon: Barcode },
];

const documentMenuItems = [
  { title: "Visa Management", url: "/admin/visa-management", icon: FileCheck },
  { title: "Flight Tickets", url: "/admin/flight-tickets", icon: Plane },
];

const agentMenuItems = [
  { title: "Agents", url: "/admin/agents", icon: UserCog },
  { title: "Agent Applications", url: "/admin/agent-applications", icon: UserPlus },
  { title: "Agent Wallets", url: "/admin/agent-wallets", icon: Landmark },
];

const operationsMenuItems = [
  { title: "Bank Accounts", url: "/admin/bank-accounts", icon: Landmark },
  { title: "Activity Log", url: "/admin/activity-log", icon: Activity },
  { title: "Amendments", url: "/admin/amendments", icon: FilePenLine },
  { title: "Support Tickets", url: "/admin/support-tickets", icon: HeadphonesIcon },
];

const systemMenuItems = [
  { title: "Staff Management", url: "/admin/staff-management", icon: Shield },
  { title: "Team Chat", url: "/admin/team-chat", icon: MessageSquare },
  { title: "Booking Form", url: "/admin/booking-form", icon: ClipboardList },
  { title: "AI Assistant", url: "/admin/ai-assistant", icon: Bot },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const MenuGroup = ({ label, items }: { label: string; items: typeof mainMenuItems }) => (
  <SidebarGroup>
    <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
      {label}
    </SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        {items.map((item) => (
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

const AdminSidebar = () => {
  const { profile, signOut } = useAuth();

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
          <MenuGroup label="Dashboard" items={mainMenuItems} />
          <MenuGroup label="Documents" items={documentMenuItems} />
          <MenuGroup label="Agents" items={agentMenuItems} />
          <MenuGroup label="Operations" items={operationsMenuItems} />
          <MenuGroup label="System" items={systemMenuItems} />
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

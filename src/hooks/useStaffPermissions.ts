import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// All granular permissions that can be assigned to staff
export const ALL_PERMISSIONS = [
  "overview",
  "packages",
  "payments",
  "pilgrims",
  "analytics",
  "id_tags",
  "visa_management",
  "flight_tickets",
  "agents",
  "agent_applications",
  "agent_wallets",
  "bank_accounts",
  "activity_log",
  "amendments",
  "support_tickets",
  "staff_management",
  "team_chat",
  "booking_form",
  "ai_assistant",
  "settings",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  overview: "Overview",
  packages: "Packages",
  payments: "Payments",
  pilgrims: "Pilgrims",
  analytics: "Analytics",
  id_tags: "ID Tags",
  visa_management: "Visa Management",
  flight_tickets: "Flight Tickets",
  agents: "Agents",
  agent_applications: "Agent Applications",
  agent_wallets: "Agent Wallets",
  bank_accounts: "Bank Accounts",
  activity_log: "Activity Log",
  amendments: "Amendments",
  support_tickets: "Support Tickets",
  staff_management: "Staff Management",
  team_chat: "Team Chat",
  booking_form: "Booking Form",
  ai_assistant: "AI Assistant",
  settings: "Settings",
};

export const useStaffPermissions = () => {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole("admin") || hasRole("super_admin");

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ["staff-permissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_permissions")
        .select("permission")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data.map((p) => p.permission as Permission);
    },
    enabled: !!user && !isAdmin,
  });

  const hasPermission = (permission: Permission): boolean => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  return { permissions, isLoading, hasPermission, isAdmin };
};

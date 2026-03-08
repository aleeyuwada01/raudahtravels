import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, CalendarCheck, CreditCard, Users, TrendingUp, UserCheck,
  ArrowUpRight, ArrowDownRight, Bot, Eye, CheckCircle2, ShieldCheck
} from "lucide-react";
import { formatPrice } from "@/data/packages";
import { Link } from "react-router-dom";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import {
  AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";

const AdminOverview = () => {
  // Main stats
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pkgRes, bookRes, payRes, agentRes, profileRes] = await Promise.all([
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id, status", { count: "exact" }),
        supabase.from("payments").select("amount, status"),
        supabase.from("agents").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);

      const totalRevenue = (payRes.data || [])
        .filter((p) => p.status === "verified")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const pendingPayments = (payRes.data || []).filter((p) => p.status === "pending").length;
      const totalBookings = bookRes.count || 0;
      const confirmedBookings = (bookRes.data || []).filter((b) => b.status === "confirmed").length;
      const activeBookings = (bookRes.data || []).filter((b) => b.status !== "cancelled").length;
      const conversionRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;

      return {
        packages: pkgRes.count || 0,
        totalBookings,
        activeBookings,
        confirmedBookings,
        totalRevenue,
        pendingPayments,
        agents: agentRes.count || 0,
        pilgrims: profileRes.count || 0,
        conversionRate,
      };
    },
  });

  // Revenue trend (last 6 months)
  const { data: revenueTrend = [] } = useQuery({
    queryKey: ["admin-revenue-trend"],
    queryFn: async () => {
      const sixMonthsAgo = subMonths(new Date(), 5);
      const { data } = await supabase
        .from("payments")
        .select("amount, status, created_at")
        .eq("status", "verified")
        .gte("created_at", startOfMonth(sixMonthsAgo).toISOString());

      const months: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const m = subMonths(new Date(), i);
        months[format(m, "MMM")] = 0;
      }
      (data || []).forEach((p) => {
        const key = format(new Date(p.created_at), "MMM");
        if (key in months) months[key] += Number(p.amount);
      });

      return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
    },
  });

  // Booking status breakdown
  const { data: bookingBreakdown = [] } = useQuery({
    queryKey: ["admin-booking-breakdown"],
    queryFn: async () => {
      const { data } = await supabase.from("bookings").select("status");
      const counts: Record<string, number> = { pending: 0, confirmed: 0, cancelled: 0, completed: 0 };
      (data || []).forEach((b) => { counts[b.status] = (counts[b.status] || 0) + 1; });
      return Object.entries(counts)
        .filter(([, v]) => v > 0)
        .map(([status, count]) => ({ status, count }));
    },
  });

  // Package type split
  const { data: packageSplit = [] } = useQuery({
    queryKey: ["admin-package-split"],
    queryFn: async () => {
      const { data } = await supabase.from("packages").select("type");
      const counts: Record<string, number> = {};
      (data || []).forEach((p) => { counts[p.type] = (counts[p.type] || 0) + 1; });
      return Object.entries(counts).map(([type, count]) => ({ type: type.charAt(0).toUpperCase() + type.slice(1), count }));
    },
  });

  // Recent bookings
  const { data: recentBookings = [] } = useQuery({
    queryKey: ["admin-recent-bookings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, full_name, reference, status, created_at, package_id")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Recent payments
  const { data: recentPayments = [] } = useQuery({
    queryKey: ["admin-recent-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("id, amount, status, method, created_at, booking_id")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    { label: "Total Pilgrims", value: String(stats?.pilgrims || 0), icon: Users, trend: "+12%", up: true },
    { label: "Total Revenue", value: formatPrice(stats?.totalRevenue || 0), icon: CreditCard, trend: "+8%", up: true },
    { label: "Total Bookings", value: String(stats?.totalBookings || 0), icon: CalendarCheck, trend: "+5%", up: true },
    { label: "Active Agents", value: String(stats?.agents || 0), icon: UserCheck, trend: "+3%", up: true },
  ];

  const statusColors: Record<string, string> = {
    pending: "hsl(45, 80%, 50%)",
    confirmed: "hsl(var(--primary))",
    cancelled: "hsl(0, 84%, 60%)",
    completed: "hsl(139, 46%, 40%)",
  };

  const pieColors = ["hsl(var(--primary))", "hsl(0, 0%, 70%)"];

  const quickActions = [
    { label: "Manage Packages", icon: Package, href: "/admin/packages" },
    { label: "Verify Payments", icon: CheckCircle2, href: "/admin/payments" },
    { label: "View Pilgrims", icon: Eye, href: "/admin/pilgrims" },
    { label: "AI Assistant", icon: Bot, href: "/admin/ai-assistant" },
  ];

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
      case "verified": return "default";
      case "pending": return "secondary";
      case "cancelled":
      case "rejected": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-body text-3xl md:text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-base text-muted-foreground mt-1">Overview of your Hajj & Umrah operations</p>
      </div>

      {/* Stat Cards — 2 large cards like reference */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((c) => (
            <Card key={c.label} className="border border-border rounded-2xl shadow-none">
              <CardContent className="p-7">
                <div className="flex items-center gap-2 mb-1">
                  <c.icon className="h-5 w-5 text-muted-foreground" />
                  <p className="text-base font-medium text-muted-foreground">{c.label}</p>
                </div>
                <div className="flex items-end gap-3 mt-3">
                  <p className="text-5xl md:text-6xl font-bold text-foreground tracking-tight leading-none">{c.value}</p>
                </div>
                {c.trend && (
                  <div className="flex items-center gap-2 mt-4">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${c.up ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {c.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                      {c.trend}
                    </span>
                    <span className="text-sm text-muted-foreground">vs last month</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border border-border rounded-2xl shadow-none">
          <CardHeader className="pb-2 px-7 pt-7">
            <CardTitle className="text-lg font-semibold font-body">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-7 pb-7">
            <ChartContainer config={{ revenue: { label: "Revenue", color: "hsl(var(--primary))" } }} className="h-[220px] w-full">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={13} />
                <YAxis tickLine={false} axisLine={false} fontSize={13} tickFormatter={(v) => `₦${(v / 1000000).toFixed(0)}M`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} />} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-border rounded-2xl shadow-none">
          <CardHeader className="pb-2 px-7 pt-7">
            <CardTitle className="text-lg font-semibold font-body">Booking Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center px-7 pb-7">
            <div className="h-[170px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {bookingBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status] || "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 justify-center">
              {bookingBreakdown.map((entry) => (
                <div key={entry.status} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColors[entry.status] }} />
                  <span className="capitalize text-muted-foreground">{entry.status}</span>
                  <span className="font-semibold text-foreground">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Package Split + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="border border-border rounded-2xl shadow-none">
          <CardHeader className="pb-2 px-7 pt-7">
            <CardTitle className="text-lg font-semibold font-body">Package Types</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center px-7 pb-7">
            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={packageSplit} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={60} paddingAngle={4}>
                    {packageSplit.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-5 mt-3">
              {packageSplit.map((entry, i) => (
                <div key={entry.type} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: pieColors[i % pieColors.length] }} />
                  <span className="text-muted-foreground">{entry.type}</span>
                  <span className="font-semibold text-foreground">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-border rounded-2xl shadow-none">
          <CardHeader className="pb-2 px-7 pt-7">
            <CardTitle className="text-lg font-semibold font-body">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="px-7 pb-7">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((a) => (
                <Link key={a.label} to={a.href}>
                  <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer text-center">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      <a.icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{a.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bookings */}
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-heading">Recent Bookings</CardTitle>
            <Link to="/admin/pilgrims">
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{b.full_name}</p>
                      <p className="text-xs text-muted-foreground">{b.reference || b.id.slice(0, 8)}</p>
                    </div>
                    <Badge variant={statusBadgeVariant(b.status)} className="text-[10px] capitalize shrink-0">
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-heading">Recent Payments</CardTitle>
            <Link to="/admin/payments">
              <Button variant="ghost" size="sm" className="text-xs">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{formatPrice(p.amount)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.method.replace("_", " ")}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusBadgeVariant(p.status)} className="text-[10px] capitalize">
                        {p.status}
                      </Badge>
                      {p.status === "pending" && (
                        <Link to="/admin/payments">
                          <ShieldCheck className="h-4 w-4 text-primary cursor-pointer" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;

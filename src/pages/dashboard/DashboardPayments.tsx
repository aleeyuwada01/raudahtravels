import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Zap, Landmark, Copy, Check } from "lucide-react";
import { formatPrice } from "@/data/packages";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const DashboardPayments = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: bookings = [] } = useQuery({
    queryKey: ["user-bookings-payments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, package_id, status")
        .eq("user_id", user!.id);
      if (!error && data?.length) return data;
      return [];
    },
    enabled: !!user?.id,
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["user-payments-full", user?.id],
    queryFn: async () => {
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", user!.id);
      if (!bookingsData?.length) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*, bookings(reference, packages(name, price))")
        .in("booking_id", bookingsData.map((b) => b.id))
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: bankAccounts = [] } = useQuery({
    queryKey: ["active-bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const totalOwed = bookings.reduce((sum, booking) => {
    const bookingPayments = payments.filter((p: any) => p.booking_id === booking.id);
    const paid = bookingPayments.filter((p: any) => p.status === "verified").reduce((s: number, p: any) => s + Number(p.amount), 0);
    const packagePrice = (payments.find((py: any) => py.booking_id === booking.id) as any)?.bookings?.packages?.price || 0;
    return sum + Math.max(0, Number(packagePrice) - paid);
  }, 0);

  const statusColors: Record<string, string> = {
    pending: "bg-secondary/10 text-secondary",
    verified: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive",
    refunded: "bg-muted text-muted-foreground",
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Copied", description: "Account number copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("dashboard.payments.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.payments.subtitle")}</p>
      </div>

      {totalOwed > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                <p className="text-2xl font-bold text-destructive mt-1">{formatPrice(totalOwed)}</p>
              </div>
              <Link to="/dashboard/bookings">
                <Button className="gold-gradient text-secondary-foreground font-semibold">
                  <Zap className="h-4 w-4 mr-2" /> Make Payment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Accounts for Transfer */}
      {bankAccounts.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" /> Bank Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Use any of these accounts for bank transfers. Include your booking reference in the narration.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {bankAccounts.map((acc) => (
                <div key={acc.id} className="border rounded-lg p-3 bg-muted/30">
                  <p className="text-sm font-medium">{acc.bank_name}</p>
                  <p className="text-xs text-muted-foreground">{acc.account_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-sm font-semibold">{acc.account_number}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(acc.account_number, acc.id)}
                    >
                      {copiedId === acc.id ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />)}</div>
      ) : payments.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{t("dashboard.payments.noPayments")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.payments.noPaymentsDesc")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const booking = (payment as any).bookings;
            return (
              <Card key={payment.id} className="border-border">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{booking?.packages?.name || "Payment"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{payment.method} • {new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">{formatPrice(Number(payment.amount))}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[payment.status] || ""}`}>{payment.status}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardPayments;

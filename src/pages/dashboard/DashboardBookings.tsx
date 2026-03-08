import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Package, FilePenLine } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "@/data/packages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const DashboardBookings = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amendDialog, setAmendDialog] = useState<any>(null);
  const [amendForm, setAmendForm] = useState({ amendment_type: "date_change", details: "" });

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["user-bookings-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, packages(name, type, category, price, duration)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["user-payments-bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("amount, status, booking_id")
        .in("booking_id", bookings.map((b) => b.id));
      if (error) throw error;
      return data || [];
    },
    enabled: bookings.length > 0,
  });

  const { data: amendments = [] } = useQuery({
    queryKey: ["user-amendments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_amendments")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const submitAmendment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("booking_amendments").insert({
        booking_id: amendDialog.id,
        user_id: user!.id,
        amendment_type: amendForm.amendment_type,
        details: { description: amendForm.details },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-amendments"] });
      toast({ title: "Amendment submitted", description: "Your request is under review." });
      setAmendDialog(null);
      setAmendForm({ amendment_type: "date_change", details: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusColors: Record<string, string> = {
    pending: "bg-secondary/10 text-secondary",
    confirmed: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/10 text-destructive",
    completed: "bg-muted text-muted-foreground",
  };

  const amendStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("dashboard.bookings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.bookings.subtitle")}</p>
        </div>
        <Link to="/dashboard/packages">
          <Button className="gold-gradient text-secondary-foreground font-semibold" size="sm">{t("dashboard.bookings.newBooking")}</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />)}</div>
      ) : bookings.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center">
            <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{t("dashboard.bookings.noBookings")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("dashboard.bookings.noBookingsDesc")}</p>
            <Link to="/dashboard/packages">
              <Button className="gold-gradient text-secondary-foreground font-semibold">{t("dashboard.actions.browsePackages")}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const pkg = (booking as any).packages;
            const bookingTotal = pkg?.price || 0;
            const bookingPayments = payments.filter((p) => p.booking_id === booking.id);
            const bookingPaid = bookingPayments.filter((p) => p.status === "verified").reduce((sum, p) => sum + Number(p.amount), 0);
            const bookingOutstanding = bookingTotal - bookingPaid;
            const bookingAmendments = amendments.filter((a) => a.booking_id === booking.id);

            return (
              <Card key={booking.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-foreground truncate">{pkg?.name || "Package"}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ref: {booking.reference || booking.id.slice(0, 8)} • {pkg?.duration || "—"}
                        </p>
                        {pkg?.price && (
                          <div className="flex gap-3 text-sm mt-1">
                            <p className="font-semibold text-secondary">{formatPrice(pkg.price)}</p>
                            {bookingOutstanding > 0 && <p className="text-destructive">Outstanding: {formatPrice(bookingOutstanding)}</p>}
                          </div>
                        )}
                        {bookingAmendments.length > 0 && (
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {bookingAmendments.map((a) => (
                              <Badge key={a.id} variant="outline" className={`text-xs ${amendStatusColors[a.status] || ""}`}>
                                {a.amendment_type.replace("_", " ")} — {a.status}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[booking.status] || ""}`}>
                        {booking.status}
                      </span>
                      <p className="text-xs text-muted-foreground">{new Date(booking.created_at).toLocaleDateString()}</p>
                      {(booking.status === "confirmed" || booking.status === "pending") && (
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setAmendDialog(booking)}>
                          <FilePenLine className="h-3 w-3 mr-1" /> Amend
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Amendment Dialog */}
      <Dialog open={!!amendDialog} onOpenChange={() => setAmendDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Amendment</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Booking: {amendDialog?.reference || amendDialog?.id?.slice(0, 8)}</p>
          <div className="space-y-4">
            <div>
              <Label>Amendment Type</Label>
              <Select value={amendForm.amendment_type} onValueChange={(v) => setAmendForm({ ...amendForm, amendment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date_change">Date Change</SelectItem>
                  <SelectItem value="name_correction">Name Correction</SelectItem>
                  <SelectItem value="package_upgrade">Package Upgrade</SelectItem>
                  <SelectItem value="room_change">Room Change</SelectItem>
                  <SelectItem value="cancellation">Cancellation Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Details</Label>
              <Textarea value={amendForm.details} onChange={(e) => setAmendForm({ ...amendForm, details: e.target.value })} placeholder="Describe the changes you need…" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmendDialog(null)}>Cancel</Button>
            <Button onClick={() => submitAmendment.mutate()} disabled={!amendForm.details || submitAmendment.isPending}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardBookings;

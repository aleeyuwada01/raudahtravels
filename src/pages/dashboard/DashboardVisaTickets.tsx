import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Plane, Download, MessageSquare, ShieldCheck } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  uploaded: "bg-chart-2/10 text-chart-2",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  uploaded: "Uploaded",
  approved: "Approved",
  rejected: "Rejected",
};

const DashboardVisaTickets = () => {
  const { user } = useAuth();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["user-visa-tickets-full", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, full_name, reference, visa_status, ticket_status, visa_provider, flight_provider, visa_file_url, ticket_file_url, admin_visa_message, admin_ticket_message, departure_city, packages(name, type)")
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from("visa-tickets").createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const visaApproved = bookings.filter((b: any) => b.visa_status === "approved").length;
  const ticketApproved = bookings.filter((b: any) => b.ticket_status === "approved").length;
  const visaPending = bookings.filter((b: any) => b.visa_status === "pending").length;
  const ticketPending = bookings.filter((b: any) => b.ticket_status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Visa & Flight Tickets</h1>
        <p className="text-muted-foreground">View and download your visa and flight ticket documents</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{visaApproved}</p>
            <p className="text-xs text-muted-foreground">Visas Approved</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{visaPending}</p>
            <p className="text-xs text-muted-foreground">Visas Pending</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{ticketApproved}</p>
            <p className="text-xs text-muted-foreground">Tickets Ready</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{ticketPending}</p>
            <p className="text-xs text-muted-foreground">Tickets Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : bookings.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No bookings found. Your visa and ticket details will appear here once you have an active booking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: any) => (
            <Card key={booking.id} className="border-border overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-base font-heading">{booking.packages?.name || "Package"}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ref: {booking.reference || booking.id.slice(0, 8)}
                      {booking.departure_city && ` • From ${booking.departure_city}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">{booking.packages?.type || "—"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Visa Section */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Visa</p>
                        {booking.visa_provider && (
                          <p className="text-xs text-muted-foreground">Provider: {booking.visa_provider}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[booking.visa_status] || "bg-muted"}>
                        {statusLabels[booking.visa_status] || booking.visa_status}
                      </Badge>
                      {booking.visa_file_url && (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(booking.visa_file_url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                  {booking.admin_visa_message && (
                    <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{booking.admin_visa_message}</span>
                    </div>
                  )}
                </div>

                {/* Flight Ticket Section */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plane className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Flight Ticket</p>
                        {booking.flight_provider && (
                          <p className="text-xs text-muted-foreground">Airlines: {booking.flight_provider}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[booking.ticket_status] || "bg-muted"}>
                        {statusLabels[booking.ticket_status] || booking.ticket_status}
                      </Badge>
                      {booking.ticket_file_url && (
                        <Button variant="outline" size="sm" onClick={() => handleDownload(booking.ticket_file_url)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                  {booking.admin_ticket_message && (
                    <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{booking.admin_ticket_message}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardVisaTickets;

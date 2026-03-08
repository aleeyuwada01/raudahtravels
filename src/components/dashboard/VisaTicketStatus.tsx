import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Plane, Download, MessageSquare } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  uploaded: "bg-chart-2/10 text-chart-2",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const VisaTicketStatus = () => {
  const { user } = useAuth();

  const { data: bookings = [] } = useQuery({
    queryKey: ["user-visa-ticket-status", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, full_name, reference, visa_status, ticket_status, visa_provider, flight_provider, visa_file_url, ticket_file_url, admin_visa_message, admin_ticket_message, packages(name)")
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

  if (bookings.length === 0) return null;

  // Only show if any booking has non-pending visa or ticket status
  const hasVisaTicketData = bookings.some(
    (b: any) => b.visa_status !== "pending" || b.ticket_status !== "pending" || b.visa_file_url || b.ticket_file_url
  );

  if (!hasVisaTicketData) return null;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Visa & Flight Ticket Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking: any) => (
          <div key={booking.id} className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{booking.packages?.name || "Package"}</p>
                <p className="text-xs text-muted-foreground">Ref: {booking.reference || booking.id.slice(0, 8)}</p>
              </div>
            </div>

            {/* Visa Row */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-background border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Visa</p>
                  {booking.visa_provider && (
                    <p className="text-xs text-muted-foreground">Provider: {booking.visa_provider}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[booking.visa_status] || "bg-muted"}>
                  {booking.visa_status}
                </Badge>
                {booking.visa_file_url && (
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(booking.visa_file_url)}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {booking.admin_visa_message && (
              <div className="flex items-start gap-2 px-3 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{booking.admin_visa_message}</span>
              </div>
            )}

            {/* Ticket Row */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-md bg-background border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <Plane className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Flight Ticket</p>
                  {booking.flight_provider && (
                    <p className="text-xs text-muted-foreground">Airlines: {booking.flight_provider}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[booking.ticket_status] || "bg-muted"}>
                  {booking.ticket_status}
                </Badge>
                {booking.ticket_file_url && (
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(booking.ticket_file_url)}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {booking.admin_ticket_message && (
              <div className="flex items-start gap-2 px-3 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                <span>{booking.admin_ticket_message}</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default VisaTicketStatus;

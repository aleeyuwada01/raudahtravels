import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileCheck, Plane, Download, Search, Users, MessageSquare, ChevronDown } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  uploaded: "bg-chart-2/10 text-chart-2",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const AgentVisaTickets = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["agent-visa-tickets", user?.id],
    queryFn: async () => {
      const { data: agentData } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (!agentData) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select("id, full_name, reference, passport_number, visa_status, ticket_status, visa_provider, flight_provider, visa_file_url, ticket_file_url, admin_visa_message, admin_ticket_message, departure_city, packages(name, type)")
        .eq("agent_id", agentData.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Group bookings by client name
  const groupedClients = useMemo(() => {
    const filtered = bookings.filter((b: any) => {
      const q = search.toLowerCase();
      return b.full_name.toLowerCase().includes(q) ||
        (b.reference || "").toLowerCase().includes(q) ||
        (b.passport_number || "").toLowerCase().includes(q);
    });

    const groups: Record<string, { name: string; passport: string; bookings: any[] }> = {};
    filtered.forEach((b: any) => {
      const key = b.full_name;
      if (!groups[key]) {
        groups[key] = { name: b.full_name, passport: b.passport_number || "No passport", bookings: [] };
      }
      groups[key].bookings.push(b);
    });
    return Object.values(groups);
  }, [bookings, search]);

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from("visa-tickets").createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const visaCounts = {
    pending: bookings.filter((b: any) => b.visa_status === "pending").length,
    approved: bookings.filter((b: any) => b.visa_status === "approved").length,
    uploaded: bookings.filter((b: any) => b.visa_status === "uploaded").length,
  };
  const ticketCounts = {
    pending: bookings.filter((b: any) => b.ticket_status === "pending").length,
    approved: bookings.filter((b: any) => b.ticket_status === "approved").length,
    uploaded: bookings.filter((b: any) => b.ticket_status === "uploaded").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading">Visa & Flight Tickets</h1>
        <p className="text-muted-foreground mt-1">Track visa and flight ticket status for all your clients</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
            <p className="text-xs text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{visaCounts.approved}</p>
            <p className="text-xs text-muted-foreground">Visas Approved</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{ticketCounts.approved}</p>
            <p className="text-xs text-muted-foreground">Tickets Ready</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{visaCounts.pending + ticketCounts.pending}</p>
            <p className="text-xs text-muted-foreground">Total Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Client Accordion Groups */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : groupedClients.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            No clients found
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {groupedClients.map((client) => {
            const allVisaApproved = client.bookings.every((b: any) => b.visa_status === "approved");
            const allTicketApproved = client.bookings.every((b: any) => b.ticket_status === "approved");
            const anyRejected = client.bookings.some((b: any) => b.visa_status === "rejected" || b.ticket_status === "rejected");

            return (
              <AccordionItem key={client.name} value={client.name} className="border border-border rounded-lg overflow-hidden bg-card">
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center justify-between w-full mr-2">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full shrink-0 ${anyRejected ? 'bg-destructive' : allVisaApproved && allTicketApproved ? 'bg-primary' : 'bg-secondary'}`} />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.passport} • {client.bookings.length} booking(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        V: {client.bookings.filter((b: any) => b.visa_status === "approved").length}/{client.bookings.length}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        T: {client.bookings.filter((b: any) => b.ticket_status === "approved").length}/{client.bookings.length}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 space-y-3">
                  {client.bookings.map((b: any) => (
                    <div key={b.id} className="p-3 rounded-lg bg-muted/30 border border-border space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-medium">{b.packages?.name || "Package"}</p>
                          <p className="text-xs text-muted-foreground">Ref: {b.reference || b.id.slice(0, 8)}{b.departure_city && ` • ${b.departure_city}`}</p>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">{b.packages?.type || "—"}</Badge>
                      </div>

                      {/* Visa Row */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-background border border-border">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Visa</p>
                            {b.visa_provider && <p className="text-xs text-muted-foreground">{b.visa_provider}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[b.visa_status] || "bg-muted"}>{b.visa_status}</Badge>
                          {b.visa_file_url && (
                            <Button variant="outline" size="sm" onClick={() => handleDownload(b.visa_file_url)}>
                              <Download className="h-3.5 w-3.5 mr-1" />Visa PDF
                            </Button>
                          )}
                        </div>
                      </div>
                      {b.admin_visa_message && (
                        <div className="flex items-start gap-2 px-2.5 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{b.admin_visa_message}</span>
                        </div>
                      )}

                      {/* Ticket Row */}
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-background border border-border">
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Flight Ticket</p>
                            {b.flight_provider && <p className="text-xs text-muted-foreground">{b.flight_provider}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[b.ticket_status] || "bg-muted"}>{b.ticket_status}</Badge>
                          {b.ticket_file_url && (
                            <Button variant="outline" size="sm" onClick={() => handleDownload(b.ticket_file_url)}>
                              <Download className="h-3.5 w-3.5 mr-1" />Ticket PDF
                            </Button>
                          )}
                        </div>
                      </div>
                      {b.admin_ticket_message && (
                        <div className="flex items-start gap-2 px-2.5 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{b.admin_ticket_message}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
};

export default AgentVisaTickets;

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileCheck, Plane, Download, Search, Users } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  uploaded: "bg-chart-2/10 text-chart-2",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const AgentVisaTickets = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [visaFilter, setVisaFilter] = useState<string>("all");
  const [ticketFilter, setTicketFilter] = useState<string>("all");

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
        .select("id, full_name, reference, passport_number, visa_status, ticket_status, visa_provider, flight_provider, visa_file_url, ticket_file_url, departure_city, packages(name, type)")
        .eq("agent_id", agentData.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const filtered = bookings.filter((b: any) => {
    const matchSearch =
      b.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (b.reference || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.passport_number || "").toLowerCase().includes(search.toLowerCase());
    const matchVisa = visaFilter === "all" || b.visa_status === visaFilter;
    const matchTicket = ticketFilter === "all" || b.ticket_status === ticketFilter;
    return matchSearch && matchVisa && matchTicket;
  });

  const handleDownload = async (filePath: string) => {
    const { data } = await supabase.storage.from("visa-tickets").createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const visaCounts = {
    pending: bookings.filter((b: any) => b.visa_status === "pending").length,
    approved: bookings.filter((b: any) => b.visa_status === "approved").length,
  };
  const ticketCounts = {
    pending: bookings.filter((b: any) => b.ticket_status === "pending").length,
    approved: bookings.filter((b: any) => b.ticket_status === "approved").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Visa & Flight Tickets</h1>
        <p className="text-muted-foreground mt-1">Track visa and flight ticket status for all your clients</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{bookings.length}</p>
            <p className="text-xs text-muted-foreground">Total Clients</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-secondary">{visaCounts.pending}</p>
            <p className="text-xs text-muted-foreground">Visas Pending</p>
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
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={visaFilter} onValueChange={setVisaFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Visa Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visas</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="uploaded">Uploaded</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ticketFilter} onValueChange={setTicketFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Ticket Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="uploaded">Uploaded</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Visa</TableHead>
                  <TableHead>Flight Ticket</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <p className="font-medium">{b.full_name}</p>
                        <p className="text-xs text-muted-foreground">{b.passport_number || "No passport"}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{b.reference || b.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{b.packages?.name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[b.visa_status] || "bg-muted"}>{b.visa_status}</Badge>
                          {b.visa_provider && <span className="text-xs text-muted-foreground">{b.visa_provider}</span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[b.ticket_status] || "bg-muted"}>{b.ticket_status}</Badge>
                          {b.flight_provider && <span className="text-xs text-muted-foreground">{b.flight_provider}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {b.visa_file_url && (
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(b.visa_file_url)} title="Download Visa">
                              <FileCheck className="h-4 w-4" />
                            </Button>
                          )}
                          {b.ticket_file_url && (
                            <Button variant="ghost" size="sm" onClick={() => handleDownload(b.ticket_file_url)} title="Download Ticket">
                              <Plane className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentVisaTickets;

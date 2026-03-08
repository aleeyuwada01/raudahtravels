import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plane, Upload, Eye, Printer, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ticketStatusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  uploaded: "bg-chart-2/10 text-chart-2",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminFlightTickets = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [flightProvider, setFlightProvider] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [newStatus, setNewStatus] = useState("uploaded");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-ticket-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, full_name, reference, status, passport_number, ticket_status, flight_provider, ticket_file_url, admin_ticket_message, departure_city, created_at, packages(name, type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = bookings.filter((b: any) => {
    const matchSearch =
      b.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (b.reference || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.passport_number || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.ticket_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) return;

      let fileUrl = selectedBooking.ticket_file_url;

      if (uploadFile) {
        const ext = uploadFile.name.split(".").pop();
        const path = `tickets/${selectedBooking.id}/ticket.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("visa-tickets")
          .upload(path, uploadFile, { upsert: true });
        if (uploadError) throw uploadError;
        fileUrl = path;
      }

      const { error } = await supabase
        .from("bookings")
        .update({
          ticket_status: newStatus,
          flight_provider: flightProvider || selectedBooking.flight_provider,
          ticket_file_url: fileUrl,
          admin_ticket_message: adminMessage || selectedBooking.admin_ticket_message,
        } as any)
        .eq("id", selectedBooking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Flight ticket updated", description: "Ticket details saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["admin-ticket-bookings"] });
      setSelectedBooking(null);
      setUploadFile(null);
      setFlightProvider("");
      setAdminMessage("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleViewFile = async (filePath: string) => {
    const { data } = await supabase.storage.from("visa-tickets").createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handlePrintFile = async (filePath: string) => {
    const { data } = await supabase.storage.from("visa-tickets").createSignedUrl(filePath, 300);
    if (data?.signedUrl) {
      const printWindow = window.open(data.signedUrl, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    }
  };

  const openUploadDialog = (booking: any) => {
    setSelectedBooking(booking);
    setFlightProvider(booking.flight_provider || "");
    setAdminMessage(booking.admin_ticket_message || "");
    setNewStatus(booking.ticket_status === "pending" ? "uploaded" : booking.ticket_status);
    setUploadFile(null);
  };

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter((b: any) => b.ticket_status === "pending").length,
    uploaded: bookings.filter((b: any) => b.ticket_status === "uploaded").length,
    approved: bookings.filter((b: any) => b.ticket_status === "approved").length,
    rejected: bookings.filter((b: any) => b.ticket_status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Flight Tickets</h1>
        <p className="text-muted-foreground">Manage airline tickets and flight schedules</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["all", "pending", "uploaded", "approved", "rejected"] as const).map((s) => (
          <Card
            key={s}
            className={`cursor-pointer transition-all border-2 ${statusFilter === s ? "border-primary" : "border-border hover:border-primary/30"}`}
            onClick={() => setStatusFilter(s)}
          >
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{statusCounts[s]}</p>
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, ref, passport..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pilgrim</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Passport</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Plane className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No pilgrims found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.full_name}</TableCell>
                    <TableCell className="font-mono text-xs">{b.reference || b.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-xs">{b.passport_number || "—"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{b.packages?.name || "—"}</p>
                        <Badge variant="outline" className="capitalize text-xs">{b.packages?.type || "—"}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{b.departure_city || "—"}</TableCell>
                    <TableCell className="text-sm">{b.flight_provider || "—"}</TableCell>
                    <TableCell>
                      <Badge className={ticketStatusColors[b.ticket_status] || "bg-muted"}>{b.ticket_status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {b.ticket_file_url && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleViewFile(b.ticket_file_url)} title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handlePrintFile(b.ticket_file_url)} title="Print">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openUploadDialog(b)} title="Upload/Edit">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Flight Ticket — {selectedBooking?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ticket Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Airlines / Flight Provider</Label>
              <Input placeholder="e.g. Max Air, Flynas..." value={flightProvider} onChange={(e) => setFlightProvider(e.target.value)} />
            </div>

            <div>
              <Label>Upload Ticket Document (PDF/Image)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
              {selectedBooking?.ticket_file_url && !uploadFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current file: {selectedBooking.ticket_file_url.split("/").pop()}
                </p>
              )}
            </div>

            <div>
              <Label>Admin Message (Optional)</Label>
              <Textarea placeholder="Add a note for the pilgrim..." value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} rows={3} />
            </div>

            <Button className="w-full" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? "Saving..." : "Save Ticket Details"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFlightTickets;

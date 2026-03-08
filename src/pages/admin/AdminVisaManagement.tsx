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
import { FileCheck, Upload, Eye, Printer, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import AdminTablePagination, { usePagination } from "@/components/admin/AdminTablePagination";

const visaStatusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  uploaded: "bg-chart-2/10 text-chart-2",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminVisaManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [visaProvider, setVisaProvider] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [newStatus, setNewStatus] = useState("uploaded");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-visa-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, full_name, reference, status, passport_number, visa_status, visa_provider, visa_file_url, admin_visa_message, agent_id, created_at, packages(name, type), agents(business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = bookings.filter((b: any) => {
    const matchSearch = b.full_name.toLowerCase().includes(search.toLowerCase()) || (b.reference || "").toLowerCase().includes(search.toLowerCase()) || (b.passport_number || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || b.visa_status === statusFilter;
    return matchSearch && matchStatus;
  });

  const { totalPages, paginate } = usePagination(filtered, 10);
  const paginatedItems = paginate(currentPage);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedBooking) return;
      let fileUrl = selectedBooking.visa_file_url;
      if (uploadFile) {
        const ext = uploadFile.name.split(".").pop();
        const path = `visas/${selectedBooking.id}/visa.${ext}`;
        const { error: uploadError } = await supabase.storage.from("visa-tickets").upload(path, uploadFile, { upsert: true });
        if (uploadError) throw uploadError;
        fileUrl = path;
      }
      const { error } = await supabase.from("bookings").update({ visa_status: newStatus, visa_provider: visaProvider || selectedBooking.visa_provider, visa_file_url: fileUrl, admin_visa_message: adminMessage || selectedBooking.admin_visa_message } as any).eq("id", selectedBooking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Visa updated", description: "Visa details saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["admin-visa-bookings"] });
      setSelectedBooking(null); setUploadFile(null); setVisaProvider(""); setAdminMessage("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleViewFile = async (filePath: string) => {
    const { data } = await supabase.storage.from("visa-tickets").createSignedUrl(filePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handlePrintFile = async (filePath: string) => {
    const { data } = await supabase.storage.from("visa-tickets").createSignedUrl(filePath, 300);
    if (data?.signedUrl) { const pw = window.open(data.signedUrl, "_blank"); pw?.addEventListener("load", () => pw.print()); }
  };

  const openUploadDialog = (booking: any) => {
    setSelectedBooking(booking); setVisaProvider(booking.visa_provider || ""); setAdminMessage(booking.admin_visa_message || "");
    setNewStatus(booking.visa_status === "pending" ? "uploaded" : booking.visa_status); setUploadFile(null);
  };

  const statusCounts = {
    all: bookings.length,
    pending: bookings.filter((b: any) => b.visa_status === "pending").length,
    uploaded: bookings.filter((b: any) => b.visa_status === "uploaded").length,
    approved: bookings.filter((b: any) => b.visa_status === "approved").length,
    rejected: bookings.filter((b: any) => b.visa_status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Visa Management</h1>
        <p className="text-muted-foreground">Upload, track, and manage pilgrim visas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(["all", "pending", "uploaded", "approved", "rejected"] as const).map((s) => (
          <Card key={s} className={`cursor-pointer transition-all border-2 ${statusFilter === s ? "border-primary" : "border-border hover:border-primary/30"}`} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{statusCounts[s]}</p>
              <p className="text-xs text-muted-foreground capitalize">{s}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, ref, passport..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SL</TableHead>
                <TableHead>Pilgrim</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Passport</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />No pilgrims found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((b: any, index) => {
                  const sl = (currentPage - 1) * 10 + index + 1;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="text-muted-foreground font-medium">{String(sl).padStart(2, '0')}</TableCell>
                      <TableCell className="font-medium">{b.full_name}</TableCell>
                      <TableCell className="font-mono text-xs">{b.reference || b.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs">{b.passport_number || "—"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{b.packages?.name || "—"}</p>
                          <Badge variant="outline" className="capitalize text-xs">{b.packages?.type || "—"}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {b.agent_id ? <Badge variant="outline" className="text-xs">{(b as any).agents?.business_name || "Agent"}</Badge> : <span className="text-muted-foreground">Direct</span>}
                      </TableCell>
                      <TableCell className="text-sm">{b.visa_provider || "—"}</TableCell>
                      <TableCell><Badge className={visaStatusColors[b.visa_status] || "bg-muted"}>{b.visa_status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {b.visa_file_url && (
                            <>
                              <button className="h-8 w-8 rounded-lg bg-muted/80 text-muted-foreground flex items-center justify-center hover:bg-muted transition-colors" onClick={() => handleViewFile(b.visa_file_url)} title="View">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" onClick={() => handlePrintFile(b.visa_file_url)} title="Print">
                                <Printer className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" onClick={() => openUploadDialog(b)} title="Upload/Edit">
                            <Upload className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Manage Visa — {selectedBooking?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Visa Status</Label><Select value={newStatus} onValueChange={setNewStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="uploaded">Uploaded</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select></div>
            <div><Label>Visa Provider</Label><Input placeholder="e.g. Saudi Embassy, Visa Agent..." value={visaProvider} onChange={(e) => setVisaProvider(e.target.value)} /></div>
            <div><Label>Upload Visa Document (PDF/Image)</Label><Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />{selectedBooking?.visa_file_url && !uploadFile && <p className="text-xs text-muted-foreground mt-1">Current file: {selectedBooking.visa_file_url.split("/").pop()}</p>}</div>
            <div><Label>Admin Message (Optional)</Label><Textarea placeholder="Add a note for the pilgrim..." value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} rows={3} /></div>
            <Button className="w-full" onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>{uploadMutation.isPending ? "Saving..." : "Save Visa Details"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVisaManagement;

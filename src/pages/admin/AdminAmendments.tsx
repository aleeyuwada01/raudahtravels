import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FilePenLine, Search, Clock, CheckCircle2, XCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const AdminAmendments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: amendments = [], isLoading } = useQuery({
    queryKey: ["admin-amendments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_amendments")
        .select("*, bookings(reference, full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-for-amendments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name");
      if (error) throw error;
      return data;
    },
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name || "Unknown"]));

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("booking_amendments")
        .update({ status, admin_notes: adminNotes, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-amendments"] });
      toast({ title: `Amendment ${status}` });
      setSelected(null);
      setAdminNotes("");
    },
  });

  const filtered = amendments.filter((a) => {
    const ref = (a.bookings as any)?.reference || "";
    const name = (a.bookings as any)?.full_name || "";
    const matchSearch = !search || ref.toLowerCase().includes(search.toLowerCase()) || name.toLowerCase().includes(search.toLowerCase()) || a.amendment_type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Amendments</h1>
        <p className="text-muted-foreground">Review and approve booking change requests</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-yellow-600">{amendments.filter((a) => a.status === "pending").length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{amendments.filter((a) => a.status === "approved").length}</p><p className="text-xs text-muted-foreground">Approved</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-red-600">{amendments.filter((a) => a.status === "rejected").length}</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FilePenLine className="h-5 w-5" /> Amendment Queue</CardTitle>
          <div className="flex gap-3 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by reference or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No amendments found.</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((amendment) => (
                <div key={amendment.id} className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => { setSelected(amendment); setAdminNotes(amendment.admin_notes || ""); }}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{amendment.amendment_type}</span>
                        <Badge variant="outline" className={statusColors[amendment.status]}>{amendment.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Booking: {(amendment.bookings as any)?.reference || "N/A"} • {(amendment.bookings as any)?.full_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requested by {profileMap[amendment.user_id] || "Unknown"} • {format(new Date(amendment.created_at), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Amendment Review</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{selected.amendment_type}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[selected.status]}>{selected.status}</Badge></div>
                <div><span className="text-muted-foreground">Booking:</span> {(selected.bookings as any)?.reference || "N/A"}</div>
                <div><span className="text-muted-foreground">Pilgrim:</span> {(selected.bookings as any)?.full_name || "Unknown"}</div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Requested Changes</Label>
                <pre className="bg-muted rounded-lg p-3 text-xs mt-1 whitespace-pre-wrap">{JSON.stringify(selected.details, null, 2)}</pre>
              </div>
              <div>
                <Label>Admin Notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes for this amendment…" />
              </div>
              {selected.status === "pending" && (
                <DialogFooter className="gap-2">
                  <Button variant="outline" className="text-destructive" onClick={() => reviewMutation.mutate({ id: selected.id, status: "rejected" })} disabled={reviewMutation.isPending}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button onClick={() => reviewMutation.mutate({ id: selected.id, status: "approved" })} disabled={reviewMutation.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAmendments;

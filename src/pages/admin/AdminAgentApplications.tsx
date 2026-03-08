import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Briefcase, Check, X } from "lucide-react";
import { format } from "date-fns";
import AdminTablePagination, { usePagination } from "@/components/admin/AdminTablePagination";

const statusColors: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary",
  approved: "bg-primary/10 text-primary",
  rejected: "bg-destructive/10 text-destructive",
};

const AdminAgentApplications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["agent-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_applications" as any).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (app: any) => {
      const res = await supabase.functions.invoke("approve-agent-application", { body: { application_id: app.id } });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => { toast({ title: "Application approved" }); queryClient.invalidateQueries({ queryKey: ["agent-applications"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agent_applications" as any).update({ status: "rejected", reviewed_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Application rejected" }); queryClient.invalidateQueries({ queryKey: ["agent-applications"] }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = applications.filter((a: any) => tab === "all" || a.status === tab);
  const { totalPages, paginate } = usePagination(filtered, 10);
  const paginatedItems = paginate(currentPage);

  const counts = {
    pending: applications.filter((a: any) => a.status === "pending").length,
    approved: applications.filter((a: any) => a.status === "approved").length,
    rejected: applications.filter((a: any) => a.status === "rejected").length,
    all: applications.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Agent Applications</h1>
        <p className="text-muted-foreground">Review and manage agent partnership requests.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", count: counts.pending, icon: Clock, color: "text-secondary" },
          { label: "Approved", count: counts.approved, icon: CheckCircle, color: "text-primary" },
          { label: "Rejected", count: counts.rejected, icon: XCircle, color: "text-destructive" },
          { label: "Total", count: counts.all, icon: Briefcase, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div><p className="text-2xl font-bold">{s.count}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setCurrentPage(1); }}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No applications found.</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SL</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((app: any, index) => {
                        const sl = (currentPage - 1) * 10 + index + 1;
                        return (
                          <TableRow key={app.id}>
                            <TableCell className="text-muted-foreground font-medium">{String(sl).padStart(2, '0')}</TableCell>
                            <TableCell className="font-medium">{app.business_name}</TableCell>
                            <TableCell>{app.contact_person}</TableCell>
                            <TableCell className="text-sm">{app.email}</TableCell>
                            <TableCell className="text-sm">{app.phone}</TableCell>
                            <TableCell className="text-sm">{format(new Date(app.created_at), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[app.status]} variant="outline">{app.status}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-2">
                                {app.status === "pending" && (
                                  <>
                                    <button className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" onClick={() => approveMutation.mutate(app)} disabled={approveMutation.isPending} title="Approve">
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button className="h-8 w-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors" onClick={() => rejectMutation.mutate(app.id)} disabled={rejectMutation.isPending} title="Reject">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAgentApplications;

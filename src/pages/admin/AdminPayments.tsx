import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye } from "lucide-react";
import { formatPrice } from "@/data/packages";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AdminTablePagination, { usePagination } from "@/components/admin/AdminTablePagination";

const AdminPayments = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState("pending");

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-all-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, bookings(reference, full_name, packages(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status, bookingId, amount }: { id: string; status: "verified" | "rejected"; bookingId: string; amount: number }) => {
      const { error } = await supabase.from("payments").update({ status, verified_at: new Date().toISOString(), verified_by: user?.id }).eq("id", id);
      if (error) throw error;
      if (status === "verified") {
        await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);
        try { await supabase.functions.invoke("send-payment-receipt", { body: { bookingId, paymentAmount: amount } }); } catch {}
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-payments"] });
      toast({ title: `Payment ${vars.status}`, description: vars.status === "verified" ? "Receipt email sent to pilgrim" : undefined });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const processedPayments = payments.filter((p) => p.status !== "pending");
  const activeItems = tab === "pending" ? pendingPayments : processedPayments;

  const { totalPages, paginate } = usePagination(activeItems, 10);
  const paginatedItems = paginate(currentPage);

  const statusColors: Record<string, string> = {
    pending: "bg-secondary/10 text-secondary",
    verified: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive",
    refunded: "bg-muted text-muted-foreground",
  };

  const PaymentTable = ({ items, pageOffset }: { items: typeof payments; pageOffset: number }) => (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SL</TableHead>
            <TableHead>Pilgrim</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((payment, index) => {
            const booking = (payment as any).bookings;
            const sl = pageOffset + index + 1;
            return (
              <TableRow key={payment.id}>
                <TableCell className="text-muted-foreground font-medium">{String(sl).padStart(2, '0')}</TableCell>
                <TableCell className="font-medium">{booking?.full_name || "—"}</TableCell>
                <TableCell>{booking?.packages?.name || "—"}</TableCell>
                <TableCell className="text-xs">{booking?.reference || "—"}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{payment.method}</Badge></TableCell>
                <TableCell className="font-semibold">{formatPrice(Number(payment.amount))}</TableCell>
                <TableCell className="text-xs">{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[payment.status]}`}>{payment.status}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {payment.proof_of_payment_url && (
                      <a href={payment.proof_of_payment_url} target="_blank" rel="noreferrer">
                        <button className="h-8 w-8 rounded-lg bg-muted/80 text-muted-foreground flex items-center justify-center hover:bg-muted transition-colors" title="View Proof">
                          <Eye className="h-4 w-4" />
                        </button>
                      </a>
                    )}
                    {payment.status === "pending" && (
                      <>
                        <button className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" onClick={() => verifyMutation.mutate({ id: payment.id, status: "verified", bookingId: payment.booking_id, amount: Number(payment.amount) })} title="Verify">
                          <Check className="h-4 w-4" />
                        </button>
                        <button className="h-8 w-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors" onClick={() => verifyMutation.mutate({ id: payment.id, status: "rejected", bookingId: payment.booking_id, amount: Number(payment.amount) })} title="Reject">
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {items.length === 0 && (
            <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Payment Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Review and verify pilgrim payments</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}</div>
      ) : (
        <Tabs defaultValue="pending" onValueChange={(v) => { setTab(v); setCurrentPage(1); }}>
          <TabsList>
            <TabsTrigger value="pending">Pending ({pendingPayments.length})</TabsTrigger>
            <TabsTrigger value="processed">Processed ({processedPayments.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            <Card className="border-border"><CardContent className="p-0">
              <PaymentTable items={paginatedItems} pageOffset={(currentPage - 1) * 10} />
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="processed">
            <Card className="border-border"><CardContent className="p-0">
              <PaymentTable items={paginatedItems} pageOffset={(currentPage - 1) * 10} />
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminPayments;

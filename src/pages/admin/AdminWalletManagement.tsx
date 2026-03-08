import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AdminTablePagination, { usePagination } from "@/components/admin/AdminTablePagination";

const AdminWalletManagement = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [topupAmount, setTopupAmount] = useState("");
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [pendingTxnId, setPendingTxnId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["admin-agents-wallets"],
    queryFn: async () => {
      const { data: agentList, error } = await supabase.from("agents").select("id, business_name, contact_person, email, phone, agent_code, status").eq("status", "active").order("business_name");
      if (error) throw error;
      const agentIds = (agentList || []).map((a) => a.id);
      const { data: wallets } = await supabase.from("agent_wallets").select("agent_id, balance").in("agent_id", agentIds);
      const walletMap = new Map((wallets || []).map((w: any) => [w.agent_id, w.balance]));
      return (agentList || []).map((a) => ({ ...a, balance: Number(walletMap.get(a.id) || 0) }));
    },
  });

  const filtered = agents.filter((a: any) => a.business_name.toLowerCase().includes(search.toLowerCase()) || a.contact_person.toLowerCase().includes(search.toLowerCase()) || a.agent_code.toLowerCase().includes(search.toLowerCase()));

  const { totalPages, paginate } = usePagination(filtered, 10);
  const paginatedItems = paginate(currentPage);

  const initiateTopup = useMutation({
    mutationFn: async () => {
      if (!selectedAgent || !topupAmount || Number(topupAmount) <= 0) throw new Error("Select an agent and enter a valid amount");
      const { data, error } = await supabase.functions.invoke("admin-topup-wallet", { body: { agent_id: selectedAgent.id, amount: Number(topupAmount) } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => { setPendingTxnId(data.transaction_id); setShowOtpDialog(true); toast({ title: "OTP Sent", description: data.message }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      if (!pendingTxnId || otpValue.length !== 6) throw new Error("Enter the 6-digit OTP");
      const { data, error } = await supabase.functions.invoke("verify-topup-otp", { body: { transaction_id: pendingTxnId, otp: otpValue } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Success!", description: `Wallet topped up. New balance: ₦${Number(data.new_balance).toLocaleString()}` });
      setShowOtpDialog(false); setSelectedAgent(null); setTopupAmount(""); setOtpValue(""); setPendingTxnId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-agents-wallets"] });
    },
    onError: (err: any) => toast({ title: "Verification Failed", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Agent Wallets</h1>
        <p className="text-muted-foreground">Manage agent wallet balances and top-ups</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search agents..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SL</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />No agents found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((a: any, index) => {
                  const sl = (currentPage - 1) * 10 + index + 1;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-muted-foreground font-medium">{String(sl).padStart(2, '0')}</TableCell>
                      <TableCell>
                        <div><p className="font-medium">{a.business_name}</p><p className="text-xs text-muted-foreground">{a.contact_person}</p></div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{a.agent_code}</Badge></TableCell>
                      <TableCell className="text-sm">{a.email}</TableCell>
                      <TableCell className="text-sm">{a.phone}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">₦{a.balance.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <button className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" onClick={() => { setSelectedAgent(a); setTopupAmount(""); }} title="Top Up">
                            <Plus className="h-4 w-4" />
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

      <Dialog open={!!selectedAgent && !showOtpDialog} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Top Up Wallet — {selectedAgent?.business_name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p><span className="text-muted-foreground">Agent:</span> {selectedAgent?.contact_person}</p>
              <p><span className="text-muted-foreground">Current Balance:</span> <strong className="text-primary">₦{selectedAgent?.balance?.toLocaleString()}</strong></p>
            </div>
            <div><Label>Top-up Amount (₦)</Label><Input type="number" placeholder="e.g. 500000" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} min={1} /></div>
            <p className="text-xs text-muted-foreground">A 6-digit OTP will be sent to <strong>{selectedAgent?.email}</strong> for verification.</p>
            <Button className="w-full" onClick={() => initiateTopup.mutate()} disabled={initiateTopup.isPending || !topupAmount || Number(topupAmount) <= 0}>
              {initiateTopup.isPending ? "Sending OTP..." : `Send OTP & Top Up ₦${Number(topupAmount || 0).toLocaleString()}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOtpDialog} onOpenChange={(open) => { if (!open) { setShowOtpDialog(false); setOtpValue(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Enter OTP Verification Code</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">A 6-digit code was sent to <strong>{selectedAgent?.email}</strong></p>
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                <InputOTPGroup><InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} /></InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="w-full" onClick={() => verifyOtp.mutate()} disabled={verifyOtp.isPending || otpValue.length !== 6}>
              {verifyOtp.isPending ? "Verifying..." : "Verify & Credit Wallet"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Code expires in 10 minutes</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWalletManagement;

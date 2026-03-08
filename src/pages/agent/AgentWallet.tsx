import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowUpCircle, ArrowDownCircle, Clock } from "lucide-react";

const AgentWallet = () => {
  const { user } = useAuth();

  const { data: agent } = useQuery({
    queryKey: ["agent-profile-wallet", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, contact_person, business_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: wallet } = useQuery({
    queryKey: ["agent-wallet", agent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_wallets")
        .select("*")
        .eq("agent_id", agent!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!agent?.id,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["agent-wallet-transactions", wallet?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!wallet?.id,
  });

  const balance = Number(wallet?.balance || 0);
  const totalCredits = transactions
    .filter((t: any) => t.type === "credit" && !t.reference?.startsWith("OTP:"))
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalDebits = transactions
    .filter((t: any) => t.type === "debit")
    .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground mt-1">Your wallet balance and transaction history</p>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold text-foreground">₦{balance.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-chart-2/10">
                <ArrowUpCircle className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Top-ups</p>
                <p className="text-2xl font-bold text-foreground">₦{totalCredits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <ArrowDownCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">₦{totalDebits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!wallet && (
        <Card className="border-secondary/30">
          <CardContent className="py-8 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Your wallet hasn't been set up yet. Contact an administrator to activate your wallet.</p>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      {wallet && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>{transactions.length} transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No transactions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions
                    .filter((t: any) => !t.reference?.startsWith("OTP:"))
                    .map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-sm">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge className={t.type === "credit" ? "bg-chart-2/10 text-chart-2" : "bg-destructive/10 text-destructive"}>
                            {t.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{t.description || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{t.reference || "—"}</TableCell>
                        <TableCell className={`text-right font-semibold ${t.type === "credit" ? "text-chart-2" : "text-destructive"}`}>
                          {t.type === "credit" ? "+" : "−"}₦{Math.abs(Number(t.amount)).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgentWallet;

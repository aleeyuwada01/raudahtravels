import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Landmark, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const emptyAccount = { bank_name: "", account_name: "", account_number: "", is_active: true };

const AdminBankAccounts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyAccount);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_accounts").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error } = await supabase.from("bank_accounts").update(form).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bank_accounts").insert({ ...form, sort_order: accounts.length });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast({ title: editing ? "Account updated" : "Account added" });
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyAccount);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast({ title: "Account deleted" });
    },
  });

  const openEdit = (account: any) => {
    setEditing(account);
    setForm({ bank_name: account.bank_name, account_name: account.account_name, account_number: account.account_number, is_active: account.is_active });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Bank Accounts</h1>
          <p className="text-muted-foreground">Configure company bank details for user visibility</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyAccount); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Account
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Loading…</p>
      ) : accounts.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No bank accounts configured yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => (
            <Card key={acc.id} className={!acc.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    {acc.bank_name}
                  </CardTitle>
                  <Badge variant={acc.is_active ? "default" : "secondary"}>{acc.is_active ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Account Name:</span> {acc.account_name}</p>
                <p><span className="text-muted-foreground">Account Number:</span> <span className="font-mono font-medium">{acc.account_number}</span></p>
                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => openEdit(acc)}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteMutation.mutate(acc.id)}><Trash2 className="h-3 w-3 mr-1" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Bank Account" : "Add Bank Account"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="e.g. First Bank" /></div>
            <div><Label>Account Name</Label><Input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} placeholder="e.g. Raudah Travels Ltd" /></div>
            <div><Label>Account Number</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} placeholder="e.g. 0123456789" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active (visible to users)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.bank_name || !form.account_name || !form.account_number || saveMutation.isPending}>
              {editing ? "Update" : "Add"} Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBankAccounts;

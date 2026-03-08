import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Phone, Mail, Plus, HeadphonesIcon, Clock, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const DashboardSupport = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [form, setForm] = useState({ subject: "", message: "", category: "general", priority: "normal" });

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["user-support-tickets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("support_tickets").insert({
        user_id: user!.id,
        subject: form.subject,
        message: form.message,
        category: form.category,
        priority: form.priority,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-support-tickets"] });
      toast({ title: "Ticket submitted", description: "Our team will respond shortly." });
      setCreateOpen(false);
      setForm({ subject: "", message: "", category: "general", priority: "normal" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleWhatsApp = () => {
    window.open("https://wa.me/2348035378973?text=Hello%20Raudah%20Travels,%20I%20need%20assistance.", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("dashboard.support.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.support.subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Ticket
        </Button>
      </div>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets"><HeadphonesIcon className="h-4 w-4 mr-1.5" /> My Tickets</TabsTrigger>
          <TabsTrigger value="contact"><MessageCircle className="h-4 w-4 mr-1.5" /> Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4 space-y-3">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />)}</div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <HeadphonesIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">No tickets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Submit a ticket and our team will assist you.</p>
                <Button onClick={() => setCreateOpen(true)}>Create Ticket</Button>
              </CardContent>
            </Card>
          ) : (
            tickets.map((ticket) => (
              <Card key={ticket.id} className="border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{ticket.subject}</span>
                        <Badge variant="outline" className={statusColors[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
                        <Badge variant="outline" className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{ticket.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{format(new Date(ticket.created_at), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="contact" className="mt-4">
          <div className="grid gap-4 max-w-2xl">
            <Card className="border-border hover:shadow-md transition-shadow cursor-pointer" onClick={handleWhatsApp}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10"><MessageCircle className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-medium text-foreground">WhatsApp</h3><p className="text-sm text-muted-foreground">{t("dashboard.support.whatsappDesc")}</p></div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10"><Phone className="h-6 w-6 text-primary" /></div>
                <div><h3 className="font-medium text-foreground">{t("dashboard.support.phone")}</h3><p className="text-sm text-muted-foreground">+234 803 537 8973</p></div>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 rounded-full bg-secondary/10"><Mail className="h-6 w-6 text-secondary" /></div>
                <div><h3 className="font-medium text-foreground">{t("dashboard.support.email")}</h3><p className="text-sm text-muted-foreground">flyraudah@gmail.com</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Submit a Support Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of your issue" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="booking">Booking</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Describe your issue in detail…" rows={4} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createTicket.mutate()} disabled={!form.subject || !form.message || createTicket.isPending}>Submit Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Ticket Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedTicket?.subject}</DialogTitle></DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge className={statusColors[selectedTicket.status]}>{selectedTicket.status.replace("_", " ")}</Badge>
                <Badge className={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                <Badge variant="secondary">{selectedTicket.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Created: {format(new Date(selectedTicket.created_at), "PPpp")}</p>
              <div className="bg-muted rounded-lg p-3 text-sm">{selectedTicket.message}</div>
              {selectedTicket.resolved_at && (
                <p className="text-xs text-green-600">Resolved: {format(new Date(selectedTicket.resolved_at), "PPpp")}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardSupport;

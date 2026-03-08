import { useState } from "react";
import { Settings, Globe, Bell, Shield, Palette, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();

  const [general, setGeneral] = useState({
    company_name: "Raudah Travels",
    company_email: "info@raudahtravels.com",
    company_phone: "+234 800 000 0000",
    whatsapp_number: "+234 800 000 0000",
    website_url: "https://raudahtravels.com",
    default_currency: "NGN",
  });

  const [notifications, setNotifications] = useState({
    email_booking_confirmed: true,
    email_payment_verified: true,
    email_visa_uploaded: true,
    email_ticket_uploaded: true,
    sms_enabled: false,
    whatsapp_enabled: true,
  });

  const [security, setSecurity] = useState({
    require_email_verification: true,
    session_timeout_hours: 24,
    max_login_attempts: 5,
  });

  const save = () => toast({ title: "Settings saved", description: "Your changes have been saved successfully." });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">System-wide configuration and preferences</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Globe className="h-4 w-4 mr-1.5" /> General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-4 w-4 mr-1.5" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Company Information</CardTitle><CardDescription>Basic company details displayed across the platform</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Company Name</Label><Input value={general.company_name} onChange={(e) => setGeneral({ ...general, company_name: e.target.value })} /></div>
                <div><Label>Company Email</Label><Input value={general.company_email} onChange={(e) => setGeneral({ ...general, company_email: e.target.value })} /></div>
                <div><Label>Company Phone</Label><Input value={general.company_phone} onChange={(e) => setGeneral({ ...general, company_phone: e.target.value })} /></div>
                <div><Label>WhatsApp Number</Label><Input value={general.whatsapp_number} onChange={(e) => setGeneral({ ...general, whatsapp_number: e.target.value })} /></div>
                <div><Label>Website URL</Label><Input value={general.website_url} onChange={(e) => setGeneral({ ...general, website_url: e.target.value })} /></div>
                <div>
                  <Label>Default Currency</Label>
                  <Select value={general.default_currency} onValueChange={(v) => setGeneral({ ...general, default_currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NGN">NGN (₦)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="SAR">SAR (﷼)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={save}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Email Notifications</CardTitle><CardDescription>Configure which events trigger email notifications</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email_booking_confirmed", label: "Booking Confirmed" },
                { key: "email_payment_verified", label: "Payment Verified" },
                { key: "email_visa_uploaded", label: "Visa Uploaded" },
                { key: "email_ticket_uploaded", label: "Flight Ticket Uploaded" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">Send email when {item.label.toLowerCase()}</p></div>
                  <Switch checked={(notifications as any)[item.key]} onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })} />
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium">SMS Notifications</p><p className="text-xs text-muted-foreground">Send SMS alerts (requires SMS provider)</p></div>
                <Switch checked={notifications.sms_enabled} onCheckedChange={(v) => setNotifications({ ...notifications, sms_enabled: v })} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium">WhatsApp Notifications</p><p className="text-xs text-muted-foreground">Send WhatsApp messages for key events</p></div>
                <Switch checked={notifications.whatsapp_enabled} onCheckedChange={(v) => setNotifications({ ...notifications, whatsapp_enabled: v })} />
              </div>
              <Button onClick={save}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Security Settings</CardTitle><CardDescription>Authentication and access control settings</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div><p className="text-sm font-medium">Require Email Verification</p><p className="text-xs text-muted-foreground">Users must verify email before accessing dashboard</p></div>
                <Switch checked={security.require_email_verification} onCheckedChange={(v) => setSecurity({ ...security, require_email_verification: v })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Session Timeout (hours)</Label><Input type="number" value={security.session_timeout_hours} onChange={(e) => setSecurity({ ...security, session_timeout_hours: Number(e.target.value) })} /></div>
                <div><Label>Max Login Attempts</Label><Input type="number" value={security.max_login_attempts} onChange={(e) => setSecurity({ ...security, max_login_attempts: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={save}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;

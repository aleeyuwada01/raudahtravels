import { useState } from "react";
import { ClipboardList, Eye, GripVertical, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface FormField {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "textarea" | "file";
  required: boolean;
  enabled: boolean;
  options?: string[];
}

const DEFAULT_FIELDS: FormField[] = [
  { id: "full_name", label: "Full Name (as on passport)", type: "text", required: true, enabled: true },
  { id: "passport_number", label: "Passport Number", type: "text", required: true, enabled: true },
  { id: "passport_expiry", label: "Passport Expiry Date", type: "date", required: true, enabled: true },
  { id: "date_of_birth", label: "Date of Birth", type: "date", required: true, enabled: true },
  { id: "gender", label: "Gender", type: "select", required: true, enabled: true, options: ["Male", "Female"] },
  { id: "departure_city", label: "Departure City", type: "select", required: false, enabled: true, options: ["Lagos", "Abuja", "Kano"] },
  { id: "room_preference", label: "Room Preference", type: "select", required: false, enabled: true, options: ["Sharing", "Double", "Triple", "Quad"] },
  { id: "emergency_contact_name", label: "Emergency Contact Name", type: "text", required: false, enabled: true },
  { id: "emergency_contact_phone", label: "Emergency Contact Phone", type: "text", required: false, enabled: true },
  { id: "emergency_contact_relationship", label: "Emergency Contact Relationship", type: "text", required: false, enabled: true },
  { id: "special_requests", label: "Special Requests", type: "textarea", required: false, enabled: true },
];

const AdminBookingForm = () => {
  const { toast } = useToast();
  const [fields, setFields] = useState<FormField[]>(DEFAULT_FIELDS);
  const [previewMode, setPreviewMode] = useState(false);

  const toggleField = (id: string, key: "required" | "enabled") => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: !f[key] } : f)));
  };

  const enabledFields = fields.filter((f) => f.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Booking Form</h1>
          <p className="text-muted-foreground">Configure the pilgrim registration schema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 mr-2" /> {previewMode ? "Edit Mode" : "Preview"}
          </Button>
          <Button onClick={() => toast({ title: "Configuration saved" })}>Save Changes</Button>
        </div>
      </div>

      {previewMode ? (
        <Card>
          <CardHeader><CardTitle>Form Preview</CardTitle></CardHeader>
          <CardContent className="space-y-4 max-w-lg">
            {enabledFields.map((field) => (
              <div key={field.id}>
                <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
                {field.type === "select" ? (
                  <Select disabled>
                    <SelectTrigger><SelectValue placeholder={`Select ${field.label.toLowerCase()}…`} /></SelectTrigger>
                    <SelectContent>{field.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                ) : field.type === "textarea" ? (
                  <textarea className="w-full border rounded-md p-2 text-sm bg-background" rows={3} disabled placeholder={`Enter ${field.label.toLowerCase()}…`} />
                ) : (
                  <Input type={field.type} disabled placeholder={`Enter ${field.label.toLowerCase()}…`} />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Form Fields</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{field.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{field.type}</Badge>
                      {field.required && <Badge variant="outline" className="text-xs text-destructive border-destructive/30">Required</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Switch checked={field.required} onCheckedChange={() => toggleField(field.id, "required")} />
                      <span className="text-xs text-muted-foreground">Required</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch checked={field.enabled} onCheckedChange={() => toggleField(field.id, "enabled")} />
                      <span className="text-xs text-muted-foreground">Enabled</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBookingForm;

import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminBookingForm = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Booking Form</h1>
        <p className="text-muted-foreground">Configure the pilgrim registration schema</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Form Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Booking form builder coming in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingForm;

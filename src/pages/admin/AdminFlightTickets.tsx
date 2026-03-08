import { Plane } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminFlightTickets = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Flight Tickets</h1>
        <p className="text-muted-foreground">Manage airline tickets and flight schedules</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Flight ticket management coming in Phase 2.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFlightTickets;

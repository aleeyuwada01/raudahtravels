import { HeadphonesIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminSupportTickets = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Support Tickets</h1>
        <p className="text-muted-foreground">Multi-category helpdesk with staff routing</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5" />
            Ticket Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Support ticket system coming in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSupportTickets;

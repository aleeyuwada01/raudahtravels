import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminActivityLog = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Activity Log</h1>
        <p className="text-muted-foreground">Immutable audit trail of system modifications</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Activity log coming in Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLog;

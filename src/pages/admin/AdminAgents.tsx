import { UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminAgents = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Agents</h1>
        <p className="text-muted-foreground">Directory of approved travel agents with performance metrics</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Agent Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Agent directory coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAgents;

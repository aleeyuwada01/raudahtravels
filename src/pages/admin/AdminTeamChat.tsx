import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminTeamChat = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Team Chat</h1>
        <p className="text-muted-foreground">Internal real-time messaging for staff</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Team chat coming in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTeamChat;

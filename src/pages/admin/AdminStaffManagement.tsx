import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminStaffManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Staff Management</h1>
        <p className="text-muted-foreground">Manage employees and granular permissions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Staff & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Staff management coming in Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStaffManagement;

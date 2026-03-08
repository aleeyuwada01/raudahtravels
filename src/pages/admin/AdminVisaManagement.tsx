import { FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminVisaManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Visa Management</h1>
        <p className="text-muted-foreground">Upload, track, and manage pilgrim visas</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Visa Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Visa management features coming in Phase 2.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVisaManagement;

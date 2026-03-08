import { FilePenLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminAmendments = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Amendments</h1>
        <p className="text-muted-foreground">Review and approve booking change requests</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePenLine className="h-5 w-5" />
            Amendment Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Amendment management coming in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAmendments;

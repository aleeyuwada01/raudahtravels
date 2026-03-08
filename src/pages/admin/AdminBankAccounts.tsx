import { Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminBankAccounts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Bank Accounts</h1>
        <p className="text-muted-foreground">Configure company bank details for user visibility</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5" />
            Bank Account Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bank account management coming in Phase 5.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBankAccounts;

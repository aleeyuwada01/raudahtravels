import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import AdminTablePagination, { usePagination } from "@/components/admin/AdminTablePagination";

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-primary/10 text-primary border-primary/20",
  UPDATE: "bg-secondary/10 text-secondary border-secondary/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminActivityLog = () => {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["admin-activity-log"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_activity").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return data;
    },
  });

  const userIds = [...new Set(activities.map((a) => a.user_id).filter(Boolean))] as string[];
  const { data: profiles = [] } = useQuery({
    queryKey: ["activity-profiles", userIds.join(",")],
    queryFn: async () => {
      if (!userIds.length) return [];
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      return data ?? [];
    },
    enabled: userIds.length > 0,
  });

  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p.full_name]));
  const entityTypes = [...new Set(activities.map((a) => a.entity_type).filter(Boolean))];

  const filtered = activities.filter((a) => {
    if (entityFilter !== "all" && a.entity_type !== entityFilter) return false;
    if (actionFilter !== "all" && a.action !== actionFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const name = a.user_id ? profileMap[a.user_id]?.toLowerCase() : "";
      if (!a.entity_type?.toLowerCase().includes(term) && !a.entity_id?.toLowerCase().includes(term) && !a.action?.toLowerCase().includes(term) && !name?.includes(term)) return false;
    }
    return true;
  });

  const { totalPages, paginate } = usePagination(filtered, 10);
  const paginatedItems = paginate(currentPage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Activity Log</h1>
        <p className="text-muted-foreground">Immutable audit trail of system modifications</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by user, entity..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-44"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Entity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map((t) => <SelectItem key={t} value={t!}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />System Activity ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading activity...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No activity recorded yet</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Entity ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((a, index) => {
                    const sl = (currentPage - 1) * 10 + index + 1;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-muted-foreground font-medium">{String(sl).padStart(2, '0')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date(a.created_at), "MMM d, yyyy HH:mm:ss")}</TableCell>
                        <TableCell className="text-sm">{a.user_id ? profileMap[a.user_id] || a.user_id.slice(0, 8) + "..." : "System"}</TableCell>
                        <TableCell><Badge variant="outline" className={ACTION_COLORS[a.action] || ""}>{a.action}</Badge></TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{a.entity_type || "—"}</Badge></TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{a.entity_id ? a.entity_id.slice(0, 12) + "..." : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <AdminTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminActivityLog;

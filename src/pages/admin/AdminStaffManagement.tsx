import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Plus, Trash2, Search, UserCog, Eye, Edit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { ALL_PERMISSIONS, PERMISSION_LABELS, type Permission } from "@/hooks/useStaffPermissions";
import { useAuth } from "@/contexts/AuthContext";
import AdminTablePagination, { usePagination } from "@/components/admin/AdminTablePagination";

const AdminStaffManagement = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Permission[]>([]);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editPerms, setEditPerms] = useState<Permission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: staffMembers = [], isLoading } = useQuery({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const { data: staffRoles, error } = await supabase.from("user_roles").select("user_id, role").in("role", ["staff", "support", "moderator"]);
      if (error) throw error;
      if (!staffRoles.length) return [];
      const userIds = [...new Set(staffRoles.map((r) => r.user_id))];
      const [profilesRes, permsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, phone").in("id", userIds),
        supabase.from("staff_permissions").select("*").in("user_id", userIds),
      ]);
      return userIds.map((uid) => ({
        id: uid,
        profile: profilesRes.data?.find((p) => p.id === uid),
        roles: staffRoles.filter((r) => r.user_id === uid).map((r) => r.role),
        permissions: (permsRes.data?.filter((p) => p.user_id === uid) ?? []).map((p) => p.permission),
      }));
    },
  });

  const addByIdMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: Permission[] }) => {
      await supabase.from("user_roles").insert({ user_id: userId, role: "staff" as any });
      if (permissions.length > 0) {
        await supabase.from("staff_permissions").insert(permissions.map((p) => ({ user_id: userId, permission: p, granted_by: user?.id })));
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-staff"] }); setAddOpen(false); setNewEmail(""); setSelectedPerms([]); toast({ title: "Staff member added" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updatePermsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: Permission[] }) => {
      await supabase.from("staff_permissions").delete().eq("user_id", userId);
      if (permissions.length > 0) {
        await supabase.from("staff_permissions").insert(permissions.map((p) => ({ user_id: userId, permission: p, granted_by: user?.id })));
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-staff"] }); setEditUserId(null); toast({ title: "Permissions updated" }); },
  });

  const removeStaffMutation = useMutation({
    mutationFn: async (userId: string) => {
      await Promise.all([
        supabase.from("staff_permissions").delete().eq("user_id", userId),
        supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "staff" as any),
      ]);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-staff"] }); toast({ title: "Staff member removed" }); },
  });

  const filtered = staffMembers.filter((s) => !search || s.profile?.full_name?.toLowerCase().includes(search.toLowerCase()));
  const { totalPages, paginate } = usePagination(filtered, 10);
  const paginatedItems = paginate(currentPage);

  const togglePerm = (perm: Permission, list: Permission[], setter: (v: Permission[]) => void) => {
    setter(list.includes(perm) ? list.filter((p) => p !== perm) : [...list, perm]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff members and granular permissions</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Staff</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>User ID (UUID from Pilgrims list)</Label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="e.g. abc123-..." /></div>
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {ALL_PERMISSIONS.map((perm) => (
                    <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={selectedPerms.includes(perm)} onCheckedChange={() => togglePerm(perm, selectedPerms, setSelectedPerms)} />
                      {PERMISSION_LABELS[perm]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPerms([...ALL_PERMISSIONS])}>Select All</Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedPerms([])}>Clear All</Button>
              </div>
              <Button className="w-full" disabled={!newEmail} onClick={() => addByIdMutation.mutate({ userId: newEmail, permissions: selectedPerms })}>Add Staff Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Staff Members ({staffMembers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search staff..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No staff members found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SL</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((staff, index) => {
                    const sl = (currentPage - 1) * 10 + index + 1;
                    return (
                      <TableRow key={staff.id}>
                        <TableCell className="text-muted-foreground font-medium">{String(sl).padStart(2, '0')}</TableCell>
                        <TableCell className="font-medium">{staff.profile?.full_name || "Unknown"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {staff.roles.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editUserId === staff.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-1">
                                {ALL_PERMISSIONS.map((perm) => (
                                  <label key={perm} className="flex items-center gap-1.5 text-xs cursor-pointer">
                                    <Checkbox checked={editPerms.includes(perm)} onCheckedChange={() => togglePerm(perm, editPerms, setEditPerms)} />
                                    {PERMISSION_LABELS[perm]}
                                  </label>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updatePermsMutation.mutate({ userId: staff.id, permissions: editPerms })}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditUserId(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-1 flex-wrap">
                              {staff.permissions.length === 0 ? (
                                <span className="text-xs text-muted-foreground">No permissions</span>
                              ) : staff.permissions.length === ALL_PERMISSIONS.length ? (
                                <Badge variant="default" className="text-xs">Full Access</Badge>
                              ) : (
                                staff.permissions.slice(0, 3).map((p) => <Badge key={p} variant="outline" className="text-xs">{PERMISSION_LABELS[p as Permission] || p}</Badge>)
                              )}
                              {staff.permissions.length > 3 && <Badge variant="outline" className="text-xs">+{staff.permissions.length - 3}</Badge>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <button className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors" onClick={() => { setEditUserId(staff.id); setEditPerms(staff.permissions as Permission[]); }} title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="h-8 w-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors" onClick={() => removeStaffMutation.mutate(staff.id)} title="Remove">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
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

export default AdminStaffManagement;

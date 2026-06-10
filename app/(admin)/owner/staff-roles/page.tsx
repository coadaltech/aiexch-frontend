"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Copy,
  Pencil,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  useStaffRoles,
  useDeleteStaffRole,
  useCloneStaffRole,
  type StaffRole,
} from "@/hooks/useStaff";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Can, usePermissions } from "@/contexts/PermissionContext";
import { StaffRoleModal } from "@/components/owner/staff-role-modal";

const ROLE_TIER_LABEL: Record<number, string> = {
  3: "Admin",
  4: "Super",
  5: "Master",
  6: "Agent",
};

export default function StaffRolesPage() {
  const { has } = usePermissions();
  const { data: roles = [], isLoading } = useStaffRoles();
  const deleteMutation = useDeleteStaffRole();
  const cloneMutation = useCloneStaffRole();
  const confirmDialog = useConfirm();
  const [editingRole, setEditingRole] = useState<StaffRole | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [roles, search]);

  const handleDelete = (role: StaffRole) => {
    confirmDialog.confirm(
      "Delete Role",
      `Delete the "${role.name}" role? Staff currently using it must be reassigned first.`,
      () => deleteMutation.mutate(role.id),
    );
  };

  const handleClone = (role: StaffRole) => {
    cloneMutation.mutate({ id: role.id, name: `${role.name} (copy)` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Staff Roles
          </h1>
          <p className="text-sm text-muted-foreground">
            Reusable permission templates. Assign a role to a staff member to
            grant them the matching set of permissions.
          </p>
        </div>
        <Can perm="staff_roles.create">
          <Button
            onClick={() => setCreating(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            New role
          </Button>
        </Can>
      </div>

      <Card className="bg-card border">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <ShieldCheck className="h-5 w-5" />
            All roles ({roles.length})
          </CardTitle>
          <Input
            placeholder="Search by name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading roles...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {search ? "No roles match your search." : "No roles yet. Create one to get started."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((role) => (
                <Card key={role.id} className="bg-card border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-foreground">
                          {role.name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {ROLE_TIER_LABEL[role.scopeRole] ?? `Tier ${role.scopeRole}`}
                          </Badge>
                          {role.whitelabelId === null ? (
                            <Badge variant="outline" className="text-xs">
                              Global
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Whitelabel
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {role.description && (
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                        {role.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2 pt-0">
                    {has("staff_roles.edit") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRole(role)}
                        className="gap-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                    <Can perm="staff_roles.create">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClone(role)}
                        disabled={cloneMutation.isPending}
                        className="gap-1"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Clone
                      </Button>
                    </Can>
                    {!role.isSystem && (
                      <Can perm="staff_roles.delete">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(role)}
                          disabled={deleteMutation.isPending}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </Can>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(creating || editingRole) && (
        <StaffRoleModal
          open
          role={editingRole}
          onClose={() => {
            setCreating(false);
            setEditingRole(null);
          }}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.config?.title ?? ""}
        message={confirmDialog.config?.message ?? ""}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

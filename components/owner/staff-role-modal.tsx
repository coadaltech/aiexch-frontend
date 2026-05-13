"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  usePermissionsCatalog,
  useStaffRole,
  useCreateStaffRole,
  useUpdateStaffRole,
  useSetStaffRolePermissions,
  type StaffRole,
} from "@/hooks/useStaff";
import { usePermissions } from "@/contexts/PermissionContext";

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided, edit mode. Otherwise create mode. */
  role: StaffRole | null;
}

const TIER_OPTIONS = [
  { value: 3, label: "Admin" },
  { value: 4, label: "Super" },
  { value: 5, label: "Master" },
  { value: 6, label: "Agent" },
];

export function StaffRoleModal({ open, onClose, role }: Props) {
  const isEdit = !!role;
  const { has, isOwner } = usePermissions();
  const { data: catalog, isLoading: catalogLoading } = usePermissionsCatalog();
  const { data: detail, isLoading: detailLoading } = useStaffRole(role?.id ?? null);

  const createMutation = useCreateStaffRole();
  const updateMutation = useUpdateStaffRole();
  const setPermsMutation = useSetStaffRolePermissions();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scopeRole, setScopeRole] = useState<number>(3);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Hydrate when role detail loads (edit) or modal opens (create).
  useEffect(() => {
    if (!open) return;
    if (isEdit && detail) {
      setName(detail.name);
      setDescription(detail.description ?? "");
      setScopeRole(detail.scopeRole);
      setSelectedKeys(new Set(detail.permissions.map((p) => p.key)));
    } else if (!isEdit) {
      setName("");
      setDescription("");
      setScopeRole(3);
      setSelectedKeys(new Set());
    }
  }, [open, isEdit, detail]);

  const grouped = useMemo(() => {
    if (!catalog) return [];
    const out: Array<{ group: string; perms: typeof catalog.permissions }> = [];
    const byGroup = new Map<string, typeof catalog.permissions>();
    for (const p of catalog.permissions) {
      if (!byGroup.has(p.group)) byGroup.set(p.group, []);
      byGroup.get(p.group)!.push(p);
    }
    for (const g of catalog.groups) {
      if (byGroup.has(g)) out.push({ group: g, perms: byGroup.get(g)! });
    }
    return out;
  }, [catalog]);

  const togglePermission = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (perms: { key: string }[]) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const allChecked = perms.every((p) => next.has(p.key));
      if (allChecked) perms.forEach((p) => next.delete(p.key));
      else perms.forEach((p) => next.add(p.key));
      return next;
    });
  };

  const isSystem = !!role?.isSystem;
  // System templates: only Owner can edit.
  const readOnly = isSystem && !isOwner;

  const handleSave = async () => {
    if (!name.trim()) return;
    if (isEdit && role) {
      await updateMutation.mutateAsync({
        id: role.id,
        data: { name, description, scopeRole },
      });
      await setPermsMutation.mutateAsync({
        id: role.id,
        permissionKeys: Array.from(selectedKeys),
      });
    } else {
      await createMutation.mutateAsync({
        name,
        description,
        scopeRole,
        permissionKeys: Array.from(selectedKeys),
      });
    }
    onClose();
  };

  const saving =
    createMutation.isPending || updateMutation.isPending || setPermsMutation.isPending;
  const canSave = !readOnly && (isEdit ? has("staff_roles.edit") : has("staff_roles.create"));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEdit ? `Edit role: ${role?.name}` : "Create staff role"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pick the permissions this role should grant. Owner has every
            permission automatically — these settings affect Admin / Super /
            Master / Agent staff who hold this role.
          </DialogDescription>
        </DialogHeader>

        {(detailLoading && isEdit) || catalogLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="role-name" className="text-foreground">Name</Label>
                <Input
                  id="role-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sports Manager"
                  disabled={readOnly}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="role-tier" className="text-foreground">Targets user tier</Label>
                <Select
                  value={String(scopeRole)}
                  onValueChange={(v) => setScopeRole(Number(v))}
                  disabled={readOnly}
                >
                  <SelectTrigger id="role-tier" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="role-desc" className="text-foreground">Description</Label>
              <Textarea
                id="role-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description shown in lists and assignment screens"
                rows={2}
                disabled={readOnly}
                className="mt-1"
              />
            </div>

            <div className="rounded-md border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-sm font-medium text-foreground">
                  Permissions ({selectedKeys.size} selected)
                </span>
                {readOnly && (
                  <span className="text-xs text-muted-foreground">
                    System template — read-only
                  </span>
                )}
              </div>
              <div className="max-h-[40vh] overflow-y-auto p-4 space-y-5">
                {grouped.map(({ group, perms }) => {
                  const checkedCount = perms.filter((p) => selectedKeys.has(p.key)).length;
                  const allChecked = checkedCount === perms.length;
                  return (
                    <div key={group}>
                      <div className="mb-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => !readOnly && toggleGroup(perms)}
                          disabled={readOnly}
                          className="text-sm font-semibold text-foreground hover:text-primary disabled:cursor-default disabled:hover:text-foreground"
                        >
                          {group} ({checkedCount}/{perms.length})
                        </button>
                        {allChecked && (
                          <span className="text-xs text-muted-foreground">all</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pl-2">
                        {perms.map((p) => (
                          <label
                            key={p.key}
                            className="flex items-start gap-2 cursor-pointer text-sm text-foreground"
                          >
                            <Checkbox
                              checked={selectedKeys.has(p.key)}
                              onCheckedChange={() => togglePermission(p.key)}
                              disabled={readOnly}
                              className="mt-0.5"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block text-foreground">{p.label}</span>
                              <span className="block text-xs text-muted-foreground truncate">
                                {p.key}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave || saving || !name.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

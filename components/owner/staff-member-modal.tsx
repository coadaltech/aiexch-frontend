"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Trash2 } from "lucide-react";
import {
  useStaffMember,
  useStaffRoles,
  usePermissionsCatalog,
  useAssignStaffRole,
  useUnassignStaffRole,
  useUpsertOverride,
  useRemoveOverride,
  type PermissionDef,
} from "@/hooks/useStaff";
import { Can, usePermissions } from "@/contexts/PermissionContext";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function StaffMemberModal({ open, onClose, userId }: Props) {
  const { has } = usePermissions();
  const { data: detail, isLoading } = useStaffMember(userId);
  const { data: roles = [] } = useStaffRoles();
  const { data: catalog } = usePermissionsCatalog();

  const assignMutation = useAssignStaffRole();
  const unassignMutation = useUnassignStaffRole();
  const upsertOverride = useUpsertOverride();
  const removeOverride = useRemoveOverride();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const overrideByKey = useMemo(() => {
    const m = new Map<string, { effect: "GRANT" | "DENY"; permissionId: string }>();
    detail?.overrides.forEach((o) =>
      m.set(o.permissionKey, { effect: o.effect, permissionId: o.permissionId }),
    );
    return m;
  }, [detail]);

  const rolePermKeys = useMemo(() => {
    if (!detail) return new Set<string>();
    const s = new Set(detail.effectivePermissions);
    detail.overrides.forEach((o) => {
      if (o.effect === "GRANT") s.delete(o.permissionKey);
      if (o.effect === "DENY") s.add(o.permissionKey);
    });
    return s;
  }, [detail]);

  type GroupRow = {
    name: string;
    perms: PermissionDef[];
    enabled: number;
    total: number;
  };

  const groups = useMemo<GroupRow[]>(() => {
    if (!catalog) return [];
    const q = search.trim().toLowerCase();
    const byGroup = new Map<string, PermissionDef[]>();
    for (const p of catalog.permissions) {
      if (q && !p.label.toLowerCase().includes(q)) continue;
      if (!byGroup.has(p.group)) byGroup.set(p.group, []);
      byGroup.get(p.group)!.push(p);
    }
    const out: GroupRow[] = [];
    for (const g of catalog.groups) {
      const perms = byGroup.get(g);
      if (!perms || perms.length === 0) continue;
      let enabled = 0;
      for (const p of perms) {
        const ov = overrideByKey.get(p.key);
        const fromRole = rolePermKeys.has(p.key);
        if (ov ? ov.effect === "GRANT" : fromRole) enabled++;
      }
      out.push({ name: g, perms, enabled, total: perms.length });
    }
    return out;
  }, [catalog, search, overrideByKey, rolePermKeys]);

  const totalEnabled = detail?.effectivePermissions.length ?? 0;
  const totalPerms = catalog?.permissions.length ?? 0;

  const handleAssign = (staffRoleId: string) => {
    if (staffRoleId === "__none__") unassignMutation.mutate(userId);
    else assignMutation.mutate({ userId, staffRoleId });
  };

  const togglePermission = (permKey: string) => {
    const ov = overrideByKey.get(permKey);
    const fromRole = rolePermKeys.has(permKey);
    const effective = ov ? ov.effect === "GRANT" : fromRole;
    const wantOn = !effective;
    if (wantOn === fromRole) {
      if (ov) removeOverride.mutate({ userId, permissionId: ov.permissionId });
    } else {
      upsertOverride.mutate({
        userId,
        permissionKey: permKey,
        effect: wantOn ? "GRANT" : "DENY",
      });
    }
  };

  const canAssign = has("staff.assign_role");
  const canManage = has("staff.manage_overrides");
  const mutating =
    upsertOverride.isPending ||
    removeOverride.isPending ||
    assignMutation.isPending ||
    unassignMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          "max-w-3xl bg-card text-foreground p-0 gap-0",
          "h-[80vh] max-h-[640px] flex flex-col overflow-hidden",
        )}
      >
        {/* Top bar — title + role + search in one strip */}
        <DialogHeader className="flex-shrink-0 px-5 py-3 border-b border-border space-y-0">
          <DialogTitle className="text-base font-semibold text-foreground">
            {detail
              ? `Permissions · ${detail.user.username ?? "staff"}`
              : "Staff permissions"}
          </DialogTitle>
        </DialogHeader>

        {isLoading || !detail || !catalog ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            {/* Compact toolbar */}
            <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-border">
              <Can
                perm="staff.assign_role"
                fallback={
                  <span className="text-sm text-foreground">
                    Role: <strong>{detail.role?.name ?? "None"}</strong>
                  </span>
                }
              >
                <Select
                  value={detail.role?.id ?? "__none__"}
                  onValueChange={handleAssign}
                  disabled={!canAssign || mutating}
                >
                  <SelectTrigger className="h-8 w-48 text-sm">
                    <SelectValue placeholder="Pick a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No role —</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Can>
              {detail.role && canAssign && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => unassignMutation.mutate(userId)}
                  disabled={mutating}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Remove role"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}

              <div className="relative ml-2 flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search features..."
                  className="h-8 pl-7 text-sm"
                />
              </div>

              <div className="text-sm tabular-nums text-muted-foreground shrink-0">
                <strong className="text-foreground">{totalEnabled}</strong>
                <span className="mx-0.5">/</span>
                {totalPerms}
              </div>
            </div>

            {/* Permission list — flat, dense 2-column grid per category */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {groups.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No features match your search.
                </div>
              ) : (
                <div>
                  {groups.map((g, idx) => (
                    <section
                      key={g.name}
                      className={cn(idx > 0 && "border-t border-border")}
                    >
                      {/* Category strip — plain, scannable */}
                      <div className="px-5 pt-3 pb-1.5 flex items-baseline gap-2">
                        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-foreground/80">
                          {g.name}
                        </h3>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {g.enabled}/{g.total}
                        </span>
                      </div>

                      {/* Two-column permission grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 px-3 pb-2">
                        {g.perms.map((p) => {
                          const ov = overrideByKey.get(p.key);
                          const fromRole = rolePermKeys.has(p.key);
                          const effective = ov ? ov.effect === "GRANT" : fromRole;
                          return (
                            <label
                              key={p.key}
                              className={cn(
                                "flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm",
                                canManage && !mutating
                                  ? "cursor-pointer hover:bg-muted/50"
                                  : "cursor-default",
                                ov && "text-amber-700 dark:text-amber-400",
                              )}
                              title={p.description ?? undefined}
                            >
                              <span className="truncate text-foreground">
                                {p.label}
                                {ov && (
                                  <span className="ml-1.5 text-[10px] uppercase tracking-wide text-amber-600">
                                    custom
                                  </span>
                                )}
                              </span>
                              <Switch
                                checked={effective}
                                disabled={!canManage || mutating}
                                onCheckedChange={() => togglePermission(p.key)}
                                className="shrink-0"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-2.5 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Changes save automatically.
              </p>
              <Button variant="outline" onClick={onClose} className="h-8 text-sm">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

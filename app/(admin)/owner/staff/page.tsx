"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings2, UserCog, Plus } from "lucide-react";
import { useMyStaff } from "@/hooks/useStaff";
import { Can } from "@/contexts/PermissionContext";
import { StaffMemberModal } from "@/components/owner/staff-member-modal";
import { CreateStaffModal } from "@/components/owner/create-staff-modal";

const ROLE_LABEL: Record<number, string> = {
  0: "Owner",
  3: "Admin",
  4: "Super",
  5: "Master",
  6: "Agent",
};

export default function StaffMembersPage() {
  const { data: staff = [], isLoading } = useMyStaff();
  const [search, setSearch] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((u) =>
      `${u.username ?? ""} ${u.email ?? ""}`.toLowerCase().includes(q),
    );
  }, [staff, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Staff Members
          </h1>
          <p className="text-sm text-muted-foreground">
            Staff are delegated proxies of your account — they see your data
            and can only do what you allow. Each staff is created under you
            (mirroring your role) and you control their permissions.
          </p>
        </div>
        <Can perm="staff.assign_role">
          <Button
            onClick={() => setCreating(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Plus className="h-4 w-4" />
            Create staff
          </Button>
        </Can>
      </div>

      <Card className="bg-card border">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <UserCog className="h-5 w-5" />
            My staff ({staff.length})
          </CardTitle>
          <Input
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading staff...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              {search
                ? "No staff match your search."
                : "You haven't created any staff yet. Click \"Create staff\" to add one."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-3 py-3 text-muted-foreground font-medium">Username</th>
                    <th className="px-3 py-3 text-muted-foreground font-medium">Email</th>
                    <th className="px-3 py-3 text-muted-foreground font-medium">Tier</th>
                    <th className="px-3 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="px-3 py-3 text-right text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border/50 last:border-b-0 hover:bg-muted/40"
                    >
                      <td className="px-3 py-3 font-medium text-foreground">
                        {u.username ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                      <td className="px-3 py-3">
                        <Badge variant="outline">
                          {ROLE_LABEL[u.role] ?? `Role ${u.role}`}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        {u.accountStatus === false ? (
                          <Badge variant="secondary">Suspended</Badge>
                        ) : (
                          <Badge>Active</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Can
                          anyOf={["staff.assign_role", "staff.manage_overrides"]}
                          fallback={
                            <span className="text-xs text-muted-foreground">
                              View only
                            </span>
                          }
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingUserId(u.id)}
                            className="gap-1"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            Manage
                          </Button>
                        </Can>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {creating && (
        <CreateStaffModal
          open
          onClose={() => setCreating(false)}
          onCreated={(newId) => setEditingUserId(newId)}
        />
      )}

      {editingUserId && (
        <StaffMemberModal
          open
          userId={editingUserId}
          onClose={() => setEditingUserId(null)}
        />
      )}
    </div>
  );
}

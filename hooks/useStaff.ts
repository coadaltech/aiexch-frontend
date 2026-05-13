/**
 * React Query hooks for staff role and assignment management.
 *
 * Backend endpoints live in aiexch-backend/src/routes/owner/staff.ts.
 *
 * Mutations bump the user's session token server-side, so the next
 * /profile/me refresh on that user's tab will surface their new effective
 * permissions automatically (within ~13 minutes; or instantly if they
 * re-load).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ownerApi } from "@/lib/api";
import { toast } from "sonner";

export interface PermissionDef {
  id: string;
  key: string;
  group: string;
  label: string;
  description: string | null;
}

export interface StaffRole {
  id: string;
  name: string;
  description: string | null;
  scopeRole: number;
  whitelabelId: string | null;
  isSystem: boolean;
  createdBy: string | null;
  addedDate: string;
  updateDate: string;
}

export interface StaffRoleDetail extends StaffRole {
  permissions: PermissionDef[];
}

export interface StaffMemberDetail {
  user: { id: string; role: number; whitelabelId: string | null; username: string };
  role: StaffRole | null;
  overrides: { permissionId: string; effect: "GRANT" | "DENY"; permissionKey: string }[];
  effectivePermissions: string[];
}

export interface MyStaffRow {
  id: string;
  username: string;
  email: string;
  role: number;
  whitelabelId: string | null;
  accountStatus: boolean;
  parentUserId: string | null;
  isStaff: boolean;
  addedDate: string;
}

// ── Queries ────────────────────────────────────────────────────────────────

export const usePermissionsCatalog = () =>
  useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: async () => {
      const res = await ownerApi.getPermissionsCatalog();
      return res.data.data as { groups: string[]; permissions: PermissionDef[] };
    },
    // Catalog is effectively static — cache aggressively.
    staleTime: 1000 * 60 * 60,
  });

export const useStaffRoles = () =>
  useQuery({
    queryKey: ["staff-roles"],
    queryFn: async () => {
      const res = await ownerApi.getStaffRoles();
      return res.data.data as StaffRole[];
    },
  });

export const useStaffRole = (id: string | null) =>
  useQuery({
    queryKey: ["staff-role", id],
    queryFn: async () => {
      const res = await ownerApi.getStaffRole(id!);
      return res.data.data as StaffRoleDetail;
    },
    enabled: !!id,
  });

export const useStaffMember = (userId: string | null) =>
  useQuery({
    queryKey: ["staff-member", userId],
    queryFn: async () => {
      const res = await ownerApi.getStaffMember(userId!);
      return res.data.data as StaffMemberDetail;
    },
    enabled: !!userId,
  });

/** List staff users belonging to the caller (or all staff if caller is Owner). */
export const useMyStaff = () =>
  useQuery({
    queryKey: ["my-staff"],
    queryFn: async () => {
      const res = await ownerApi.listMyStaff();
      return res.data.data as MyStaffRow[];
    },
  });

/** Create a new staff user under the caller. */
export const useCreateStaff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof ownerApi.createStaff>[0]) =>
      ownerApi.createStaff(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-staff"] });
      toast.success("Staff member created");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to create staff"),
  });
};

// ── Mutations ──────────────────────────────────────────────────────────────

export const useCreateStaffRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof ownerApi.createStaffRole>[0]) =>
      ownerApi.createStaffRole(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success("Role created");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to create role"),
  });
};

export const useUpdateStaffRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof ownerApi.updateStaffRole>[1] }) =>
      ownerApi.updateStaffRole(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["staff-roles"] });
      qc.invalidateQueries({ queryKey: ["staff-role", id] });
      toast.success("Role updated");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to update role"),
  });
};

export const useSetStaffRolePermissions = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, permissionKeys }: { id: string; permissionKeys: string[] }) =>
      ownerApi.setStaffRolePermissions(id, permissionKeys),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["staff-role", id] });
      qc.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success("Permissions updated");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to update permissions"),
  });
};

export const useDeleteStaffRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ownerApi.deleteStaffRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success("Role deleted");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to delete role"),
  });
};

export const useCloneStaffRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      ownerApi.cloneStaffRole(id, name ? { name } : undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success("Role cloned");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to clone role"),
  });
};

export const useAssignStaffRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, staffRoleId }: { userId: string; staffRoleId: string }) =>
      ownerApi.assignStaffRole(userId, staffRoleId),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ["staff-member", userId] });
      toast.success("Role assigned");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to assign role"),
  });
};

export const useUnassignStaffRole = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => ownerApi.unassignStaffRole(userId),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ["staff-member", userId] });
      toast.success("Role removed");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to remove role"),
  });
};

export const useUpsertOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      permissionKey,
      effect,
    }: {
      userId: string;
      permissionKey: string;
      effect: "GRANT" | "DENY";
    }) => ownerApi.upsertOverride(userId, permissionKey, effect),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ["staff-member", userId] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to update override"),
  });
};

export const useRemoveOverride = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, permissionId }: { userId: string; permissionId: string }) =>
      ownerApi.removeOverride(userId, permissionId),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: ["staff-member", userId] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Failed to remove override"),
  });
};

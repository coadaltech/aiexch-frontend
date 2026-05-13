"use client";

/**
 * Permission gating for the owner panel.
 *
 * Reads `user.permissions` from AuthContext (populated by /profile/me and login).
 * Owner role has the full catalog server-side, so this just exposes O(1) checks.
 *
 * UI gating with these helpers is for UX only — backend re-checks every request
 * (see middleware/permissions.ts on the backend).
 *
 *   const { has, hasAny, hasAll } = usePermissions();
 *   if (!has("banners.edit")) return null;
 *
 *   <Can perm="banners.delete"><DeleteButton /></Can>
 *   <Can anyOf={["users.edit", "users.delete"]}>...</Can>
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface PermissionContextValue {
  /** All effective permission keys held by the current user. */
  permissions: ReadonlySet<string>;
  /** True iff the user holds `key`. */
  has: (key: string) => boolean;
  /** True iff the user holds at least one of `keys`. */
  hasAny: (keys: readonly string[]) => boolean;
  /** True iff the user holds every key in `keys`. */
  hasAll: (keys: readonly string[]) => boolean;
  /** True iff the user is the platform Owner (gets bypass everywhere). */
  isOwner: boolean;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<PermissionContextValue>(() => {
    // Owner bypass ONLY applies to a real, non-staff Owner. An Owner's staff
    // (role=owner, isStaff=true) walks the permission set like any other staff.
    // Without this guard, every Owner-created staff would see and click every
    // feature in the panel even when their role grants none of it.
    const isOwner = user?.role === "owner" && !user?.isStaff;
    const set = new Set(user?.permissions ?? []);

    return {
      permissions: set,
      isOwner,
      has: (key: string) => isOwner || set.has(key),
      hasAny: (keys) => isOwner || keys.some((k) => set.has(k)),
      hasAll: (keys) => isOwner || keys.every((k) => set.has(k)),
    };
  }, [user?.role, user?.isStaff, user?.permissions]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error("usePermissions must be used within <PermissionProvider>");
  return ctx;
}

/**
 * Conditional render helper. Renders `children` iff the permission test passes.
 *
 *   <Can perm="banners.delete"><DeleteButton /></Can>
 *   <Can anyOf={["users.edit", "users.status_toggle"]}>...</Can>
 *   <Can allOf={["staff.assign_role", "staff.manage_overrides"]}>...</Can>
 *
 * Provide exactly one of perm / anyOf / allOf. `fallback` (optional) renders
 * when the test fails — useful for showing a disabled state instead of hiding.
 */
export function Can({
  perm,
  anyOf,
  allOf,
  fallback = null,
  children,
}: {
  perm?: string;
  anyOf?: readonly string[];
  allOf?: readonly string[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const { has, hasAny, hasAll } = usePermissions();
  const allowed = perm ? has(perm) : anyOf ? hasAny(anyOf) : allOf ? hasAll(allOf) : false;
  return <>{allowed ? children : fallback}</>;
}

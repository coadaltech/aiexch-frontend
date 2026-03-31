// Panel role prefixes for URL routing
// Maps role (numeric or string) to the URL prefix used in the panel
export const PANEL_PREFIXES = ["owner", "admin", "super", "master", "agent"] as const;

const ROLE_NUM_TO_PREFIX: Record<number, string> = {
  0: "owner",
  3: "admin",
  4: "super",
  5: "master",
  6: "agent",
};

/**
 * Convert a role value (number or string) to the URL prefix.
 * Falls back to "owner" if the role is unrecognized.
 */
export function roleToPrefix(role: string | number | null | undefined): string {
  if (role == null) return "owner";
  if (typeof role === "number") return ROLE_NUM_TO_PREFIX[role] ?? "owner";
  const lower = String(role).toLowerCase();
  if (PANEL_PREFIXES.includes(lower as any)) return lower;
  return "owner";
}

/**
 * Check if a pathname belongs to any panel role route.
 * e.g. "/admin/users", "/owner/settings", "/super/vouchers"
 */
export function isPanelPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PANEL_PREFIXES.some((p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`));
}

/**
 * Extract the panel prefix from a pathname, or null if not a panel path.
 */
export function getPanelPrefix(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  const match = PANEL_PREFIXES.find((p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`));
  return match ?? null;
}

/**
 * Replace the panel prefix in a path with a new one.
 * e.g. replacePanelPrefix("/owner/users", "admin") → "/admin/users"
 */
export function replacePanelPrefix(path: string, newPrefix: string): string {
  for (const p of PANEL_PREFIXES) {
    if (path === `/${p}`) return `/${newPrefix}`;
    if (path.startsWith(`/${p}/`)) return `/${newPrefix}${path.slice(p.length + 1)}`;
  }
  return path;
}

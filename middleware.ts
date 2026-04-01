// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PANEL_PREFIXES = ["owner", "admin", "super", "master", "agent"] as const;
const ROLE_NUM_TO_PREFIX: Record<number, string> = {
  0: "owner",
  3: "admin",
  4: "super",
  5: "master",
  6: "agent",
};
const PANEL_ROLES_NUM = [0, 3, 4, 5, 6];
const PANEL_ROLES_STR = ["owner", "admin", "super", "master", "agent"];

function roleToPrefix(role: string | number | null): string {
  if (role == null) return "owner";
  if (typeof role === "number") return ROLE_NUM_TO_PREFIX[role] ?? "owner";
  const lower = String(role).toLowerCase();
  if (PANEL_ROLES_STR.includes(lower)) return lower;
  return "owner";
}

function isPanelPathname(pathname: string): boolean {
  return PANEL_PREFIXES.some((p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`));
}

function panelSubPath(pathname: string): string {
  for (const p of PANEL_PREFIXES) {
    if (pathname === `/${p}`) return "";
    if (pathname.startsWith(`/${p}/`)) return pathname.slice(p.length + 1);
  }
  return "";
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasRefreshToken = !!request.cookies.get("refreshToken")?.value;
  const accessToken = request.cookies.get("accessToken")?.value;

  let userRole: string | number | null = null;
  if (accessToken) {
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      userRole = payload.role ?? null;
    } catch {
      // invalid or expired access token
    }
  }

  const isPanelRole =
    userRole != null &&
    (typeof userRole === "number"
      ? PANEL_ROLES_NUM.includes(userRole)
      : PANEL_ROLES_STR.includes(String(userRole).toLowerCase()));

  const isPanelRoute = isPanelPathname(pathname);
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");

  // ── Panel route guards ────────────────────────────────────────────────────

  if (isPanelRoute) {
    // No session at all (logged out, demo user, anyone without cookies) → /login
    if (!hasRefreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Has session but access token is missing/expired → /login to re-authenticate
    // NOTE: use == null (not !userRole) because owner role is 0 which is falsy
    if (userRole === null || userRole === undefined) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Authenticated but not a panel role (normal user) → /access-denied
    if (!isPanelRole) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Valid panel user — enforce correct prefix and sub-route access
    const userPrefix = roleToPrefix(userRole);
    const currentPrefix = PANEL_PREFIXES.find(
      (p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`)
    )!;

    // Wrong prefix → redirect to their correct panel prefix
    if (currentPrefix !== userPrefix) {
      const sub = panelSubPath(pathname);
      return NextResponse.redirect(new URL(`/${userPrefix}${sub}`, request.url));
    }

    const sub = panelSubPath(pathname);
    const isOwnerRole = userPrefix === "owner";
    const isAdminRole = userPrefix === "admin";

    if (sub.startsWith("/matka") && !isOwnerRole) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    const marketingSubs = ["/promotions", "/promocodes", "/banners", "/popups"];
    if (marketingSubs.some((r) => sub.startsWith(r)) && !isOwnerRole) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    if (
      (sub.startsWith("/qrcodes") || sub.startsWith("/withdrawal-methods")) &&
      !isAdminRole
    ) {
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Rewrite /<role>/* → /owner/* so Next.js finds the actual page files
    if (currentPrefix !== "owner") {
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/owner${sub}`;
      return NextResponse.rewrite(rewriteUrl);
    }

    return NextResponse.next();
  }

  // ── Non-panel routes ──────────────────────────────────────────────────────

  // Panel users must stay in their panel — redirect them away from regular site pages
  if (hasRefreshToken && isPanelRole && !isAuthRoute) {
    const userPrefix = roleToPrefix(userRole);
    return NextResponse.redirect(new URL(`/${userPrefix}`, request.url));
  }

  // Redirect / → /home
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next|static|favicon.png|site.webmanifest|Images|icon-512.png|signin).*)",
    "/owner/:path*",
    "/admin/:path*",
    "/super/:path*",
    "/master/:path*",
    "/agent/:path*",
    "/profile/:path*",
  ],
};

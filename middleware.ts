// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Panel role prefixes (duplicated from lib/panel-utils.ts since middleware runs in edge runtime)
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

/** Check if pathname starts with any panel prefix */
function isPanelPathname(pathname: string): boolean {
  return PANEL_PREFIXES.some((p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`));
}

/** Get the sub-path after the panel prefix. e.g. "/admin/users" → "/users", "/admin" → "" */
function panelSubPath(pathname: string): string {
  for (const p of PANEL_PREFIXES) {
    if (pathname === `/${p}`) return "";
    if (pathname.startsWith(`/${p}/`)) return pathname.slice(p.length + 1);
  }
  return "";
}

const isAuthenticated = async (request: NextRequest) => {
  const token = request.cookies.get("refreshToken")?.value;
  return !!token;
};

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check auth first
  const isAuth = await isAuthenticated(request);
  const token = request.cookies.get("accessToken")?.value;

  let userRole: string | number | null = null;

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userRole = payload.role ?? null;
    } catch {
      // invalid token
    }
  }

  const isPanelRole = userRole != null && (
    typeof userRole === "number"
      ? PANEL_ROLES_NUM.includes(userRole)
      : PANEL_ROLES_STR.includes(String(userRole).toLowerCase())
  );

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password");

  if (isAuth && userRole) {
    const userPrefix = roleToPrefix(userRole);

    // Panel users visiting non-panel routes → redirect to their panel
    if (isPanelRole && !isPanelPathname(pathname) && !isAuthRoute) {
      return NextResponse.redirect(new URL(`/${userPrefix}`, request.url));
    }

    // Handle panel routes
    if (isPanelPathname(pathname)) {
      if (!isPanelRole) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }

      const currentPrefix = PANEL_PREFIXES.find(
        (p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`)
      )!;

      // If user is on wrong prefix (e.g. admin visiting /owner/*), redirect to correct prefix
      if (currentPrefix !== userPrefix) {
        const sub = panelSubPath(pathname);
        return NextResponse.redirect(new URL(`/${userPrefix}${sub}`, request.url));
      }

      // --- Access control checks (use the sub-path which is prefix-independent) ---
      const sub = panelSubPath(pathname);
      const isOwnerRole = userPrefix === "owner";
      const isAdminRole = userPrefix === "admin";

      // Owner-only routes: matka
      if (sub.startsWith("/matka") && !isOwnerRole) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }

      // Owner-only routes: marketing
      const marketingSubs = ["/promotions", "/promocodes", "/banners", "/popups"];
      if (marketingSubs.some((r) => sub.startsWith(r)) && !isOwnerRole) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }

      // Admin-only B2C routes: QR codes & withdrawal methods
      if (sub.startsWith("/qrcodes") || sub.startsWith("/withdrawal-methods")) {
        if (!isAdminRole) {
          return NextResponse.redirect(new URL("/access-denied", request.url));
        }
      }

      // Rewrite /<role>/* to /owner/* so Next.js finds the actual pages
      if (currentPrefix !== "owner") {
        const rewriteUrl = request.nextUrl.clone();
        rewriteUrl.pathname = `/owner${sub}`;
        return NextResponse.rewrite(rewriteUrl);
      }

      return NextResponse.next();
    }
  }

  // move user away from / to /home
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
    "/profile/:path*"
  ],
};

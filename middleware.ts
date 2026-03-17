// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { decode_payload_from_token } from "./lib/token-utils";

// interface JWTPayloadExtra extends JWTPayload {
//   id?: string;
//   role?: string;
// }

const isAuthenticated = async (request: NextRequest) => {
  const token = request.cookies.get("refreshToken")?.value;
  return !!token;
};

export async function middleware(request: NextRequest) {
  // console.log("[MIDDLEWARE] Running for:", req.nextUrl.pathname);
  const { pathname } = request.nextUrl;

  // Check auth first
  const isAuth = await isAuthenticated(request);
  const token = request.cookies.get("accessToken")?.value;
  // console.log("token", req.cookies.getAll());
  // req.cookies.getAll()
  // console.log("token", token);
  // console.log("[MIDDLEWARE] Token:", token ? "exists" : "missing");

  let userRole: string | number | null = null;

  // Redirect to home if no token
  if (token) {
    const tokenResult = decode_payload_from_token(token);
    if (tokenResult?.success && tokenResult?.payload) {
      userRole = tokenResult.payload.role ?? null;
    } else {
      console.error("[MIDDLEWARE] Token decode failed:", tokenResult);
    }
  } else {
    console.log("[MIDDLEWARE] No token found");
  }

  const response = NextResponse.next();

  // Panel roles: support both numeric (new JWT) and string (old cached JWT) values
  const PANEL_ROLES_NUM = [0, 3, 4, 5, 6]; // Owner, Admin, Super, Master, Agent
  const PANEL_ROLES_STR = ["owner", "admin", "super", "master", "agent"];
  const isPanelRole = userRole != null && (
    typeof userRole === "number"
      ? PANEL_ROLES_NUM.includes(userRole)
      : PANEL_ROLES_STR.includes(String(userRole).toLowerCase())
  );
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password");

  if (isAuth && userRole) {
    // Panel users (owner, admin, super, master, agent) can only access /owner and auth routes; redirect them from main site to panel
    if (isPanelRole && !pathname.startsWith("/owner") && !isAuthRoute) {
      return NextResponse.redirect(new URL("/owner", request.url));
    }
    // Special handling for owner routes - only panel roles can access
    if (pathname.startsWith("/owner")) {
      if (isPanelRole) {
        return response;
      }
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }
  }

  // move user away from / to /home
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  //// just checking

  // Admin-only routes
  // if (url.pathname.startsWith("/owner")) {
  //   console.log("[MIDDLEWARE] Admin route accessed, verifying token...");
  //   try {
  //     console.log("payload_res -> ", payload_res)
  //
  //     if (!payload_res.success) {
  //       url.pathname = "/?error=0";
  //       return NextResponse.redirect((new URL(url, request.url)));
  //     }
  //
  //     if (payload_res.payload.role !== "admin") {
  //       url.pathname = "/?error=1";
  //       return NextResponse.redirect((new URL(url, request.url)));
  //     }
  //   } catch {
  //     url.pathname = "/?error=2";
  //     return NextResponse.redirect((new URL(url, request.url)));
  //   }
  //
  //   url.pathname = "/owner";
  //   return NextResponse.redirect((new URL(url, request.url)));
  // }

  return NextResponse.next();
}

// export const config = {
//   matcher: ["/owner/:path*", "/profile/:path*"],
// };

export const config = {
  matcher: [
    "/((?!api|_next|static|favicon.png|site.webmanifest|Images|icon-512.png|signin).*)",
    "/owner/:path*",
    "/profile/:path*"
  ],
};

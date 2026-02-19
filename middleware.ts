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

  let userRole: string | null = null;

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

  if (isAuth && userRole) {
    // Special handling for admin routes - admin (ca or admin role) can access all /admin routes
    if (pathname.startsWith("/admin")) {
      if (userRole === "admin") {
        // Admin can access all admin routes
        return response;
      }
      else {
        // Non-admin users trying to access admin routes
        return NextResponse.redirect(new URL("/access-denied", request.url));
      }
    }
  }

  // move user away from / to /home
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  //// just checking

  // Admin-only routes
  // if (url.pathname.startsWith("/admin")) {
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
  //   url.pathname = "/admin";
  //   return NextResponse.redirect((new URL(url, request.url)));
  // }

  return NextResponse.next();
}

// export const config = {
//   matcher: ["/admin/:path*", "/profile/:path*"],
// };

export const config = {
  matcher: [
    "/((?!api|_next|static|favicon.png|site.webmanifest|Images|icon-512.png|signin).*)",
    "/admin/:path*",
    "/profile/:path*"
  ],
};

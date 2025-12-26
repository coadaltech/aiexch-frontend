// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
import { decode_payload_from_token } from "./lib/token-utils";

// interface JWTPayloadExtra extends JWTPayload {
//   id?: string;
//   role?: string;
// }

export async function middleware(req: NextRequest) {
  // console.log("[MIDDLEWARE] Running for:", req.nextUrl.pathname);
  const url = req.nextUrl.clone();
  const token = req.cookies.get("accessToken")?.value;
  // console.log("token", req.cookies.getAll());
  // req.cookies.getAll()
  // console.log("token", token);
  // console.log("[MIDDLEWARE] Token:", token ? "exists" : "missing");

  // Redirect to home if no token
  if (!token) {
    if (url.pathname !== "/") {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Admin-only routes
  if (url.pathname.startsWith("/admin")) {
    try {
      const payload_res = decode_payload_from_token(token)

      if (!payload_res.success) {
        url.pathname = "/?error=0";
        return NextResponse.redirect(url);
      }

      if (payload_res.payload.role !== "admin") {
        url.pathname = "/?error=1";
        return NextResponse.redirect(url);
      }
    } catch {
      url.pathname = "/?error=2";
      return NextResponse.redirect(url);
    }

    // url.pathname = "/admin";
    // return NextResponse.redirect(url);
  }

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

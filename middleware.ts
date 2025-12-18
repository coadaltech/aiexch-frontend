// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

interface JWTPayloadWithRole extends JWTPayload {
  role?: string;
}

export async function middleware(req: NextRequest) {
  console.log("[MIDDLEWARE] Running for:", req.nextUrl.pathname);
  const url = req.nextUrl.clone();
  const token = req.cookies.get("accessToken")?.value;
  console.log("token", req.cookies.getAll());
  // req.cookies.getAll()
  console.log("token", token);
  console.log("[MIDDLEWARE] Token:", token ? "exists" : "missing");

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
      const { payload } = await jwtVerify<JWTPayloadWithRole>(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );

      if (payload.role !== "admin") {
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};

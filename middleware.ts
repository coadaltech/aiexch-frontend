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
  const pathname = req.nextUrl.pathname;

  // Create response
  const response = NextResponse.next();

  // Set pathname header for server components (needed for ThemeScript)
  response.headers.set("x-pathname", pathname);

  // Only check auth for admin and profile routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/profile")) {
    const token = req.cookies.get("accessToken")?.value;
    console.log("token", req.cookies.getAll());
    console.log("token", token);
    console.log("[MIDDLEWARE] Token:", token ? "exists" : "missing");

    // Redirect to home if no token
    if (!token) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Admin-only routes
    if (pathname.startsWith("/admin")) {
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
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

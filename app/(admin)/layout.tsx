"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (isLoading) return;

      // If not logged in, redirect to login with error
      if (!isLoggedIn || !user) {
        router.push(
          `/auth/login?error=${encodeURIComponent(
            "Please login to access admin panel"
          )}`
        );
        return;
      }

      // Check if user is admin
      if (user.role !== "admin") {
        // Store debug info
        localStorage.setItem(
          "adminDebugInfo",
          JSON.stringify({
            userRole: user.role,
            userEmail: user.email,
            userId: user.id,
            timestamp: new Date().toISOString(),
            error: "User is not an admin",
          })
        );

        // Redirect to access denied page instead of home
        router.push("/admin/access-denied");
        return;
      }

      // Test admin API access
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          }/admin/test`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          localStorage.setItem(
            "adminDebugInfo",
            JSON.stringify({
              apiStatus: response.status,
              apiResponse: errorData,
              userRole: user.role,
              userEmail: user.email,
              timestamp: new Date().toISOString(),
              error: `API returned ${response.status}`,
            })
          );

          router.push(
            `/admin/access-denied?error=${encodeURIComponent(
              `API Error: ${response.status} - ${
                errorData.message || "Unknown error"
              }`
            )}`
          );
          return;
        }

        setCheckingAccess(false);
      } catch (error) {
        localStorage.setItem(
          "adminDebugInfo",
          JSON.stringify({
            apiError: error instanceof Error ? error.message : "Unknown error",
            userRole: user.role,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
            error: "Failed to connect to admin API",
          })
        );

        router.push(
          `/admin/access-denied?error=${encodeURIComponent(
            "Failed to connect to admin API"
          )}`
        );
        return;
      }
    };

    checkAdminAccess();
  }, [user, isLoggedIn, isLoading, router]);

  // Show loading while checking access
  if (isLoading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking admin access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

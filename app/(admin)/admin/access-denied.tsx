"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, LogIn } from "lucide-react";
import Link from "next/link";

export default function AdminAccessDenied() {
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Capture any error details from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const debug = localStorage.getItem("adminDebugInfo");

    if (error) {
      setErrorDetails(decodeURIComponent(error));
    }

    if (debug) {
      try {
        setDebugInfo(JSON.parse(debug));
      } catch {
        localStorage.removeItem("adminDebugInfo");
      }
    }

    // Test API connection
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
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

      const result = await response.json();

      setDebugInfo({
        apiStatus: response.status,
        apiResponse: result,
        apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        timestamp: new Date().toISOString(),
        cookies: document.cookie ? "present" : "missing",
      });
    } catch (error) {
      setDebugInfo({
        apiError: error instanceof Error ? error.message : "Unknown error",
        apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
        timestamp: new Date().toISOString(),
        cookies: document.cookie ? "present" : "missing",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl p-8 border-destructive/50">
        <div className="text-center space-y-6">
          {/* Alert Icon */}
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Admin Access Denied
            </h1>
            <p className="text-muted-foreground">
              You don't have permission to access the admin panel
            </p>
          </div>

          {/* Error Details */}
          {errorDetails && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-left">
              <p className="text-sm text-destructive font-mono">
                {errorDetails}
              </p>
            </div>
          )}

          {/* Debug Information */}
          <div className="bg-muted rounded-lg p-4 text-left space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Debug Information:
            </h3>
            <pre className="text-xs text-muted-foreground overflow-x-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={testApiConnection}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Test Connection
            </Button>

            <Link href="/auth/login">
              <Button className="gap-2">
                <LogIn className="w-4 h-4" />
                Login Again
              </Button>
            </Link>

            <Link href="/">
              <Button variant="secondary" className="gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Possible reasons for access denial:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Not logged in or session expired</li>
              <li>Not an admin user</li>
              <li>Cookie/CORS configuration issues</li>
              <li>API connection problems</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

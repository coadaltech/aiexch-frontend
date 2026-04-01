import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { decode_payload_from_token } from "@/lib/token-utils";
import clsx from "clsx";
import {
  ShieldX,
  Home,
  BookOpen,
  AlertTriangle,
  User,
  Scale,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const AccessDeniedPage = async () => {
  // const cookieStore = await cookies();
  // const token = cookieStore.get("refreshToken")?.value;

  // if (!token) {
  //   redirect("/login");
  // }

  const getRoleTheme = () => {
    return {
      title: "Access Limitation",
      portalLink: "/",
      portalText: "Go Home",
      button: "bg-nav-btn hover:bg-nav-btn/80 text-white",
    };

  };

  const theme = getRoleTheme();

  return (
    <div className="w-screen h-screen flex items-center justify-center p-4 transition-all bg-white/30">
      <Card className="w-full max-w-md border-0 shadow-none rounded-xl bg-transparent">
        <CardContent className="p-8 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={clsx(
                "rounded-full p-4 border shadow-inner",
                "bg-error-light-bg border-error-light-border"
              )}
            >
              <ShieldX className="h-12 w-12 text-danger-strong" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-danger-strong">
              Access Restricted
            </h1>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button asChild className={clsx("w-full", theme.button)}>
              <Link href={theme.portalLink}>
                <BookOpen className="h-4 w-4 mr-2" />
                {theme.portalText}
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Link>
            </Button>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-content-border-light">
            <p className="text-xs text-content-text-muted">
              If you believe this is an error, please contact support for role
              verification and access request.
            </p>
            {/* {process.env.NODE_ENV === "development" && ( */}
            {/*   <p className="text-xs text-gray-400 mt-1"> */}
            {/*     Current role: {userRole} */}
            {/*   </p> */}
            {/* )} */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDeniedPage;



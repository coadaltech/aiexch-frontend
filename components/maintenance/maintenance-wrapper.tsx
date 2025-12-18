"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { publicApi } from "@/lib/api";
import MaintenancePage from "./maintenance-page";
import { MaintenanceWrapperProps } from "@/types";

export function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const isAdminPage = pathname?.startsWith("/admin");

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await publicApi.getSettings();
        const settings = response.data.data;

        setIsMaintenanceMode(settings?.maintenanceMode || false);
        setMaintenanceMessage(settings?.maintenanceMessage || "");
      } catch (error) {
        console.error("Failed to check maintenance mode:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenanceMode();
  }, []);

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-casino-dark flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casino-primary"></div>
  //     </div>
  //   );
  // }

  if (isMaintenanceMode && !isAdminPage) {
    return <MaintenancePage message={maintenanceMessage} />;
  }

  return <>{children}</>;
}

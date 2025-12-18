"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { publicApi } from "@/lib/api";

export function MetadataLoader() {
  const pathname = usePathname();

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const response = await publicApi.getSettings();
        const data = response?.data?.data;

        // Update title
        const siteName = data?.siteName || "AIEXCH";
        const isAdmin = pathname?.startsWith("/admin");
        document.title = isAdmin 
          ? `Admin - ${siteName}` 
          : `${siteName} - Gaming Exchange Platform`;

        // Update favicon (skip for admin to keep default)
        if (!isAdmin) {
          const favicon = data?.favicon;
          if (favicon) {
            let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.head.appendChild(link);
            }
            link.href = favicon;
          }
        }

        // Update meta description
        const description = data?.description || "Experience the ultimate gaming exchange platform with casino games, sports betting, and live tournaments";
        let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement;
        if (!metaDesc) {
          metaDesc = document.createElement("meta");
          metaDesc.name = "description";
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = description;
      } catch (error) {
        console.warn("Failed to load metadata:", error);
      }
    };

    loadMetadata();
  }, [pathname]);

  return null;
}

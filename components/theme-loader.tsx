"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { publicApi } from "@/lib/api";

export function ThemeLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      setLoading(false);
      return;
    }

    const applyTheme = (theme: any) => {
      const root = document.documentElement;
      Object.entries(theme).forEach(([key, value]) => {
        if (key === "fontFamily") {
          document.body.style.fontFamily = value as string;
        } else if (key !== "radius") {
          const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
          root.style.setProperty(cssVar, value as string);
        }
      });
      if (theme.radius) root.style.setProperty("--radius", theme.radius);
    };

    const loadTheme = async () => {
      try {
        const domain = window.location.host;
        const cacheKey = `app-theme-${domain}`;
        
        // Clear cache from other domains
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('app-theme-') && key !== cacheKey) {
            localStorage.removeItem(key);
          }
        });
        
        const cachedTheme = localStorage.getItem(cacheKey);
        if (cachedTheme) {
          applyTheme(JSON.parse(cachedTheme));
          setLoading(false);
        }

        const response = await publicApi.getSettings();
        const data = response?.data?.data;
        const themeData = data?.whitelabelTheme || data?.theme;

        if (themeData) {
          const theme =
            typeof themeData === "string" ? JSON.parse(themeData) : themeData;
          localStorage.setItem(cacheKey, JSON.stringify(theme));
          applyTheme(theme);
        }
      } catch (error) {
        console.warn("Failed to load theme, using defaults:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, [pathname]);

  if (loading) {
    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ backgroundColor: "#120a1c" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-12 w-12 animate-spin rounded-full border-4"
            style={{ borderColor: "#ffd85c", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "#d9c8b3" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return null;
}

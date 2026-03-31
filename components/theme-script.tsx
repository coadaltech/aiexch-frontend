import { headers } from "next/headers";

async function getTheme() {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "";

    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/public/settings`,

      {
        headers: {
          "x-whitelabel-domain": host,
        },
        cache: "no-store",
        next: { revalidate: 0 },
      }
    );
    
    const result = await response.json();
    const data = result?.data;
    const themeData = data?.whitelabelTheme || data?.theme;
  
    if (themeData) {
      return typeof themeData === "string" ? JSON.parse(themeData) : themeData;
    }
  } catch (error) {
    console.warn("Failed to load theme server-side:", error);
  }
  return null;
}

export async function ThemeScript() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  // Don't apply whitelabel theme on admin/panel routes
  const panelPrefixes = ["owner", "admin", "super", "master", "agent"];
  if (panelPrefixes.some((p) => pathname === `/${p}` || pathname.startsWith(`/${p}/`))) {
    return null;
  }

  
  const theme = await getTheme();
  
  if (!theme) return null;

  const themeVars = Object.entries(theme)
    .filter(([key]) => key !== "fontFamily" && key !== "radius")
    .map(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
      return `${cssVar}:${value}`;
    })
    .join(";");

  const script = `
    (function() {
      // Don't apply theme on admin/panel routes
      var pp = ['owner','admin','super','master','agent'];
      var pn = window.location.pathname;
      if (pp.some(function(p){return pn==='/'+p||pn.indexOf('/'+p+'/')===0})) return;
      
      const root = document.documentElement;
      const theme = ${JSON.stringify(theme)};
      Object.entries(theme).forEach(([key, value]) => {
        if (key === "fontFamily") {
          document.body.style.fontFamily = value;
        } else if (key !== "radius") {
          const cssVar = "--" + key.replace(/([A-Z])/g, "-$1").toLowerCase();
          root.style.setProperty(cssVar, value);
        }
      });
      if (theme.radius) root.style.setProperty("--radius", theme.radius);
    })();
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root{${themeVars}}` }} />
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
}

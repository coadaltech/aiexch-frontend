"use client";

import { useSiteTheme } from "@/contexts/ThemeContext";
import { getShell } from "@/themes/shell-registry";
import type { ThemeShellProps } from "@/themes/types";

/**
 * Renders the chrome of the currently-active theme around the page content.
 * Switching themes simply re-renders this with a different shell component —
 * because it's driven by React context state, the swap is instant with no page
 * reload. MainLayout owns all logic and route flags; this only chooses the look.
 */
export function ThemedShell(props: ThemeShellProps) {
  const { theme } = useSiteTheme();
  const Shell = getShell(theme);
  return <Shell {...props} />;
}

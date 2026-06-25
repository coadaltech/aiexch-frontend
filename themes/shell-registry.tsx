import { DefaultShell } from "./default/default-shell";
import { DiamondShell } from "./diamond/diamond-shell";
import { BetfairShell } from "./betfair/betfair-shell";
import { TomexchShell } from "./tomexch/tomexch-shell";
import { DEFAULT_THEME_KEY } from "./registry";
import type { ThemeShell } from "./types";

/**
 * Maps a theme key to its layout shell component. This is the ONLY place that
 * imports the heavy layout components, keeping `registry.ts` (metadata) cheap to
 * import everywhere else.
 *
 * To add a new theme's layout: create `themes/<key>/<key>-shell.tsx` exporting a
 * component of type `ThemeShell`, then add one line here. No core/business code
 * changes — that's the extensibility contract.
 */
const SHELLS: Record<string, ThemeShell> = {
  default: DefaultShell,
  diamond: DiamondShell,
  betfair: BetfairShell,
  tomexch: TomexchShell,
};

export function getShell(key?: string | null): ThemeShell {
  return (key && SHELLS[key]) || SHELLS[DEFAULT_THEME_KEY];
}

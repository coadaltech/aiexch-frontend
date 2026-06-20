import {
  CircleDot,
  Club,
  Diamond,
  Dices,
  Flame,
  Layers,
  Spade,
  Sparkles,
  Ticket,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Canonical casino lobby category catalogue.
 *
 * Single source of truth shared by:
 *   • the casino lobby header (components/casino/casino-lobby.tsx),
 *   • the owner pinning panel (app/(admin)/owner/casino-categories),
 *   • the site top drop-header (components/layout/header.tsx).
 *
 * Categories are derived client-side from game names/categories via bucketOf()
 * in hooks/useCasinoGames.ts; these keys are the buckets. The owner can pin any
 * of these keys (persisted backend-side) to surface them in the drop-header —
 * rendered in this array's order ("keep code order").
 */
export interface CasinoCategory {
  key: string;
  label: string;
  icon: LucideIcon;
}

export const CASINO_CATEGORIES: CasinoCategory[] = [
  { key: "ROULETTE", label: "Roulette", icon: CircleDot },
  { key: "LIGHTNING", label: "Lightning", icon: Zap },
  { key: "LIVECASINO", label: "Live Casino", icon: Spade },
  { key: "TEENPATTI", label: "Teen Patti", icon: Layers },
  { key: "ANDARBAHAR", label: "Andar Bahar", icon: Layers },
  { key: "DRAGONTIGER", label: "Dragon Tiger", icon: Flame },
  { key: "BACCARAT", label: "Baccarat", icon: Diamond },
  { key: "BLACKJACK", label: "Black Jack", icon: Club },
  { key: "TABLE", label: "Table Games", icon: Dices },
  { key: "POKER", label: "Poker", icon: Club },
  { key: "HOLDEM", label: "Hold'em", icon: Club },
  { key: "INSTANTWIN", label: "Instant Win", icon: Sparkles },
  { key: "LOTTERY", label: "Lottery Games", icon: Ticket },
  { key: "RVCASINO", label: "RV Casino", icon: Diamond },
];

/** key → label lookup. */
export const CASINO_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CASINO_CATEGORIES.map((c) => [c.key, c.label]),
);

/** The drop-header / lobby path for a category, e.g. "ROULETTE" → /casino/category/roulette. */
export function casinoCategoryPath(key: string): string {
  return `/casino/category/${key.toLowerCase()}`;
}

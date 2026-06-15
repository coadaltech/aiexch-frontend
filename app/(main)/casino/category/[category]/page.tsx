"use client";

import { useParams } from "next/navigation";
import CasinoLobby from "@/components/casino/casino-lobby";

/**
 * Category-filtered casino lobby — e.g. /casino/category/roulette.
 *
 * Renders the exact same lobby as /casino, just pre-filtered to the category
 * in the URL. Category keys are uppercase internally (ROULETTE, RVCASINO, …)
 * and lowercased in the URL, so we upper-case the slug back here.
 */
export default function CasinoCategoryPage() {
  const { category } = useParams<{ category: string }>();
  return <CasinoLobby initialCat={(category ?? "").toUpperCase()} />;
}

"use client";

import { useState } from "react";
import { DiamondMatchStrip } from "./diamond-match-strip";
import { DiamondSportTabs } from "./diamond-sport-tabs";
import { DiamondMarketTable } from "./diamond-market-table";
import { DiamondCasinoGrid } from "./diamond-casino-grid";
import { DiamondFooter } from "./diamond-footer";

/**
 * Diamond exchange HOME content — the reference's main column: the featured
 * match strip, the sport-category tab bar and the live odds table. Selecting a
 * sport tab swaps the table's data source. All data comes from existing hooks.
 */
export function DiamondExchange() {
  const [sport, setSport] = useState({ id: "4", slug: "cricket" });

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <DiamondMatchStrip />
      <DiamondSportTabs
        value={sport.id}
        onChange={(id, slug) => setSport({ id, slug })}
      />
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
        <DiamondMarketTable sport={sport.slug} eventTypeId={sport.id} />
        <DiamondCasinoGrid />
        <DiamondFooter />
      </div>
    </div>
  );
}

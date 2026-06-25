"use client";

import { useSportsList } from "@/hooks/useSportsList";

/**
 * Diamond sport-category tab bar (Cricket / Football / Tennis …), styled like
 * the reference: a light-grey strip with olive separators; the active tab is a
 * solid olive box with white text. Data comes from the existing `useSportsList`
 * hook — no new logic. Selecting a tab changes which sport's markets render.
 */
export function DiamondSportTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (eventTypeId: string, sportSlug: string) => void;
}) {
  const { data: sports = [] } = useSportsList();

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto bg-[#c9c9c9] scrollbar-hide">
      {sports.map((s) => {
        const active = s.id === value;
        const slug = s.name.toLowerCase().replace(/\s+/g, "-");
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id, slug)}
            style={{ borderRadius: 0, margin: 0 }}
            className={`relative m-0 shrink-0 whitespace-nowrap rounded-none border-r border-[#8a7c1c] px-5 py-2.5 text-[15px] font-semibold transition-colors ${
              active
                ? "bg-[var(--dx-nav)] text-white"
                : "bg-[#c9c9c9] text-slate-800 hover:bg-[#bdbdbd]"
            }`}
          >
            {s.isLive && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

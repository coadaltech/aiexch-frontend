"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sidebarApi } from "@/lib/api";
import { CASINO_CATEGORIES, casinoCategoryPath } from "@/lib/casino-categories";
import { useChannelWatcher } from "./useChannelWatcher";

export interface PinnedCasinoCategory {
  key: string;
  label: string;
  href: string;
}

/**
 * Owner-pinned casino lobby categories, mapped to `{ label, href }` in the shared
 * catalogue order — the same admin-controlled source the Default theme's header
 * uses. Live-refreshed on the "casino-categories" channel when the owner toggles
 * a pin, so themed sidebars stay in sync without a reload. Nothing is hardcoded:
 * only the categories the owner has enabled are returned.
 */
export const usePinnedCasinoCategories = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["pinned-casino-categories"],
    queryFn: async () => {
      const { data } = await sidebarApi.pinnedCasinoCategories();
      return Array.isArray(data?.data) ? data.data : [];
    },
    staleTime: 60_000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["pinned-casino-categories"] });
  }, [queryClient]);
  useChannelWatcher("casino-categories", invalidate);

  const categories = useMemo<PinnedCasinoCategory[]>(() => {
    const pinned = new Set(query.data ?? []);
    if (pinned.size === 0) return [];
    return CASINO_CATEGORIES.filter((c) => pinned.has(c.key)).map((c) => ({
      key: c.key,
      label: c.label,
      href: casinoCategoryPath(c.key),
    }));
  }, [query.data]);

  return { categories, isLoading: query.isLoading };
};

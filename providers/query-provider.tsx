"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState } from "react";

/**
 * Public, static-ish queries that are SAFE to restore from localStorage on a
 * fresh page load. Restoring these means the home page (banners, promotions,
 * casino sections, sidebar, …) paints with real content on a hard refresh
 * instead of flashing loading skeletons while the network request runs.
 *
 * Auth / balance / user / exposure queries are deliberately EXCLUDED — those
 * must always come fresh from the server and must never sit in localStorage.
 * Add a query's first queryKey segment here only if it is public + cacheable.
 */
const PERSISTED_QUERY_KEYS = new Set<string>([
  "public-banners",
  "public-promotions",
  "public-popups",
  "public-settings",
  "public-casino-games",
  "home-sections",
  "section-games",
  // Static public sports catalogue used by the left sidebar — restoring these
  // stops the sidebar lists from flashing skeletons on a hard refresh.
  "sidebar",
  "series",
  "sports",
]);

// Bump when the persisted shape changes to invalidate old caches.
const PERSIST_BUSTER = "aiexch-v1";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 15 * 60 * 1000, // keep in memory 15 min (instant on back-nav)
            retry: 1,
            refetchOnWindowFocus: false, // prevent re-fetch when switching tabs
          },
        },
      })
  );

  // localStorage only exists in the browser. During SSR / the very first server
  // render there is no window, so fall back to the plain provider. Both branches
  // render identical children, so there is no hydration mismatch.
  const [persister] = useState(() =>
    typeof window === "undefined"
      ? null
      : createSyncStoragePersister({
          storage: window.localStorage,
          key: "aiexch-rq-cache",
        })
  );

  if (!persister) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 24 * 60 * 60 * 1000, // discard anything older than a day
        buster: PERSIST_BUSTER,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === "success" &&
            PERSISTED_QUERY_KEYS.has(String(query.queryKey?.[0] ?? "")),
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

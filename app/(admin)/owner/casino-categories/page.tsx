"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pin } from "lucide-react";

import { ownerApi } from "@/lib/api";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";
import { Switch } from "@/components/ui/switch";
import { CASINO_CATEGORIES } from "@/lib/casino-categories";

/**
 * Owner → Casino Categories.
 *
 * Lists every casino lobby category and lets the owner pin any of them to the
 * site's top drop-header (the same header the exchange uses). Pinned categories
 * surface there in catalogue order and deep-link into /casino/category/<key>.
 *
 * Reached from the Sports Games list via the "Casino" entry.
 */
export default function CasinoCategoriesPage() {
  const router = useRouter();
  const panelPrefix = usePanelPrefix();

  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ownerApi.getCasinoPinnedCategories();
        if (!cancelled) setPinned(new Set(res.data?.data ?? []));
      } catch (err) {
        console.error("Failed to load pinned casino categories:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (key: string) => {
    if (togglingKey) return;
    const next = !pinned.has(key);
    setTogglingKey(key);
    // Optimistic update
    setPinned((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(key);
      else copy.delete(key);
      return copy;
    });
    try {
      await ownerApi.toggleCasinoCategory(key, next);
    } catch (err) {
      console.error("Failed to toggle casino category:", err);
      // Revert on failure
      setPinned((prev) => {
        const copy = new Set(prev);
        if (next) copy.delete(key);
        else copy.add(key);
        return copy;
      });
    } finally {
      setTogglingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`${panelPrefix}/sports-games`)}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sports Games
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Casino Categories</h1>
          <p className="text-gray-600 mt-1">
            Pin a category to show it on the site&apos;s top drop-header. Pinned
            categories appear in catalogue order and open the casino pre-filtered.
          </p>
        </div>

        {/* Category list */}
        <div className="space-y-2">
          {CASINO_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isPinned = pinned.has(cat.key);
            return (
              <div
                key={cat.key}
                className={`flex items-center justify-between gap-3 rounded-lg border p-4 transition-all ${
                  isPinned
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      isPinned ? "bg-yellow-400 text-black" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800">{cat.label}</h3>
                    <p className="text-xs text-gray-500">{cat.key}</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
                    <Pin
                      className={`h-3.5 w-3.5 ${isPinned ? "fill-yellow-400 text-yellow-500" : "text-gray-400"}`}
                    />
                    Pinned
                  </span>
                  <Switch
                    checked={isPinned}
                    disabled={togglingKey === cat.key}
                    onCheckedChange={() => handleToggle(cat.key)}
                    className="data-[state=checked]:bg-yellow-500"
                  />
                </label>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-8 rounded-lg bg-gray-50 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Categories</p>
            <p className="text-2xl font-bold text-gray-800">{CASINO_CATEGORIES.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pinned to header</p>
            <p className="text-2xl font-bold text-yellow-600">{pinned.size}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

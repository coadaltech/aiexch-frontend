"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ownerApi } from "@/lib/api";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";

const MATKA_SPORT_ID = 1001;
const JAMBO_SPORT_ID = 1004;
const KALYAN_NEW_SPORT_ID = 1005;

interface Sport {
  id: number;
  name: string;
  totalCompetitions: number;
  isActive: boolean;
  is_active?: boolean;
  sort_order: number;
}

export default function SportsPage() {
  const router = useRouter();
  const panelPrefix = usePanelPrefix();
  const [search, setSearch] = useState("");
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/sports-list`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);
        const data = await response.json();

        let raw: any[] = [];
        if (Array.isArray(data)) {
          raw = data;
        } else if (data.data && Array.isArray(data.data)) {
          raw = data.data;
        }
        // Backend returns `is_active` (snake_case); normalize so the UI has a
        // stable `isActive` field to read and toggle.
        const list: Sport[] = raw.map((s: any) => ({
          ...s,
          isActive: s.isActive ?? s.is_active ?? false,
        }));
        // Already sorted by sort_order from backend; ensure stable display
        setSports(list);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSports();
  }, []);

  const filteredSports = sports.filter((sport) =>
    sport.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSportClick = (sport: Sport) => {
    if (sport.id === MATKA_SPORT_ID) {
      router.push(`${panelPrefix}/matka`);
    } else if (sport.id === JAMBO_SPORT_ID) {
      router.push(`${panelPrefix}/jambo`);
    } else if (sport.id === KALYAN_NEW_SPORT_ID) {
      router.push(`${panelPrefix}/kalyan-new`);
    } else {
      router.push(`${panelPrefix}/sports-games/competitions/${sport.id}`);
    }
  };

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────
  const handleDragStart = (index: number) => {
    dragIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null);
      dragIndexRef.current = null;
      return;
    }

    // Only reorder the full list (not filtered), mapping filtered indices back
    const reordered = [...sports];
    const draggedItem = filteredSports[dragIndex];
    const dropTarget = filteredSports[dropIndex];
    const fromIdx = reordered.findIndex((s) => s.id === draggedItem.id);
    const toIdx = reordered.findIndex((s) => s.id === dropTarget.id);

    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, draggedItem);

    // Reassign sort_order based on new position
    const updated = reordered.map((s, i) => ({ ...s, sort_order: i }));
    setSports(updated);
    setDragOverIndex(null);
    dragIndexRef.current = null;

    // Persist to backend
    saveOrder(updated);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    dragIndexRef.current = null;
  };

  const handleToggleActive = async (
    e: React.MouseEvent,
    sport: Sport,
  ) => {
    e.stopPropagation();
    if (togglingId !== null) return;
    const nextActive = !sport.isActive;
    setTogglingId(sport.id);
    // Optimistic update
    setSports((prev) =>
      prev.map((s) =>
        s.id === sport.id ? { ...s, isActive: nextActive, is_active: nextActive } : s,
      ),
    );
    try {
      await ownerApi.toggleSportActive(sport.id, nextActive);
    } catch (err) {
      console.error("Failed to toggle sport active state:", err);
      // Revert on failure
      setSports((prev) =>
        prev.map((s) =>
          s.id === sport.id
            ? { ...s, isActive: sport.isActive, is_active: sport.isActive }
            : s,
        ),
      );
    } finally {
      setTogglingId(null);
    }
  };

  const saveOrder = async (ordered: Sport[]) => {
    setSaving(true);
    try {
      await ownerApi.reorderSports(
        ordered.map((s, i) => ({ sportId: s.id, sortOrder: i })),
      );
    } catch (err) {
      console.error("Failed to save sport order:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading sports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sports Games</h1>
            <p className="text-gray-600 mt-1">
              Drag rows to reorder • click to manage competitions
            </p>
          </div>
          {saving && (
            <span className="text-sm text-blue-500 flex items-center gap-1">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              Saving order…
            </span>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search sports..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Sports List */}
        <div className="space-y-2">
          {filteredSports.map((sport, idx) => (
            <div
              key={sport.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              onClick={() => handleSportClick(sport)}
              className={`p-4 border rounded-lg transition-all cursor-pointer select-none ${
                dragOverIndex === idx
                  ? "border-blue-500 bg-blue-50 shadow-md scale-[1.01]"
                  : "border-gray-200 hover:border-blue-400 hover:shadow-md hover:bg-blue-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Drag handle */}
                  <span className="text-gray-400 cursor-grab active:cursor-grabbing select-none">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {sport.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-0.5">
                      ID: {sport.id}
                      {typeof sport.totalCompetitions === "number" &&
                        ` • ${sport.totalCompetitions} competitions`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-full text-sm ${
                      sport.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {sport.isActive ? "Active" : "Inactive"}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleToggleActive(e, sport)}
                    disabled={togglingId === sport.id}
                    title={
                      sport.isActive
                        ? "Click to hide this sport across the site"
                        : "Click to show this sport across the site"
                    }
                    className={`px-3 py-1 rounded-md text-sm font-medium border transition-colors disabled:opacity-60 disabled:cursor-wait ${
                      sport.isActive
                        ? "bg-white border-red-300 text-red-600 hover:bg-red-50"
                        : "bg-white border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    {togglingId === sport.id
                      ? "Saving…"
                      : sport.isActive
                        ? "Deactivate"
                        : "Activate"}
                  </button>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredSports.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
            <h3 className="text-gray-700 font-medium">No sports found</h3>
            <p className="text-gray-500 text-sm mt-1">
              Try a different search term
            </p>
          </div>
        )}

        {/* Simple Stats */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sports</p>
              <p className="text-2xl font-bold text-gray-800">{sports.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Sports</p>
              <p className="text-2xl font-bold text-green-600">
                {sports.filter((s) => s.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// app/owner/sports-games/competitions/[sportId]/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ownerApi } from "@/lib/api";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";

interface Competition {
  id: string;
  name: string;
  sportId: string;
  eventCount: number;
  isActive: boolean;
  /** Owner-only: flagged as a sidebar "Top competition" */
  isTop: boolean;
  /** Per-whitelabel override: true = visible, false = hidden for this whitelabel, null = no override */
  whitelabelActive: boolean;
}

const PAGE_SIZE = 50;

export default function CompetitionsPage() {
  const params = useParams();
  const router = useRouter();
  const sportId = params.sportId as string;
  const { user: currentUser } = useAuth();
  const panelPrefix = usePanelPrefix();

  const isOwner = currentUser?.role === "owner";
  const isAdmin = currentUser?.role === "admin";
  // Super/Master/Agent = read-only
  const canEdit = isOwner || isAdmin;

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sportName, setSportName] = useState("");
  // pendingChanges holds per-id desired state when it differs from the
  // server's current value. Persists across page/search changes so admins
  // can edit competitions on multiple pages before clicking Save.
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [togglingTopId, setTogglingTopId] = useState<string | null>(null);

  // Debounce the search input; reset to page 0 when search changes.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const { data } = await ownerApi.getCompetitions(sportId, {
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
          search: debouncedSearch,
        });

        let competitionsData: Competition[] = [];
        if (data.success && Array.isArray(data.data)) {
          competitionsData = data.data.map((comp: any) => ({
            id: String(comp.competition_id || comp.id),
            name: comp.name,
            sportId: String(comp.sport_id || comp.sportId),
            eventCount: Number(comp.eventCount ?? 0),
            isActive: comp.is_active ?? comp.isActive ?? false,
            isTop: comp.is_top_competition ?? comp.isTop ?? false,
            whitelabelActive: comp.whitelabelActive ?? true,
          }));
          setSportName(data.sportName || "");
          setTotalCount(Number(data.totalCount ?? competitionsData.length));
        }

        setCompetitions(competitionsData);
      } catch (error) {
        console.error("Error fetching competitions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sportId) {
      fetchCompetitions();
    }
  }, [sportId, page, debouncedSearch]);

  const originalActiveOf = useCallback(
    (c: Competition) => (isOwner ? c.isActive : c.whitelabelActive),
    [isOwner],
  );

  const effectiveActiveOf = useCallback(
    (c: Competition) => pendingChanges[c.id] ?? originalActiveOf(c),
    [pendingChanges, originalActiveOf],
  );

  const stats = useMemo(() => {
    const activeOnPage = competitions.filter(originalActiveOf).length;
    return {
      totalAll: totalCount,
      totalOnPage: competitions.length,
      activeOnPage,
      pendingChanges: Object.keys(pendingChanges).length,
    };
  }, [competitions, totalCount, pendingChanges, originalActiveOf]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const fromIndex = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIndex = Math.min(totalCount, page * PAGE_SIZE + competitions.length);

  // Owner-only toggle for sidebar "Top competition" flag. Independent of the
  // checkbox grid — toggles in one request with optimistic update + rollback.
  const handleToggleTop = useCallback(
    async (competition: Competition) => {
      if (!isOwner) return;
      if (togglingTopId !== null) return;
      const next = !competition.isTop;
      setTogglingTopId(competition.id);
      setCompetitions((prev) =>
        prev.map((c) =>
          c.id === competition.id ? { ...c, isTop: next } : c,
        ),
      );
      try {
        await ownerApi.toggleTopCompetition(competition.id, next);
      } catch (err) {
        console.error("Failed to toggle top-competition:", err);
        setCompetitions((prev) =>
          prev.map((c) =>
            c.id === competition.id ? { ...c, isTop: competition.isTop } : c,
          ),
        );
      } finally {
        setTogglingTopId(null);
      }
    },
    [isOwner, togglingTopId],
  );

  const handleToggleActive = useCallback(
    (competition: Competition) => {
      const original = originalActiveOf(competition);
      const current = pendingChanges[competition.id] ?? original;
      const next = !current;
      setPendingChanges((prev) => {
        const updated = { ...prev };
        if (next === original) {
          delete updated[competition.id];
        } else {
          updated[competition.id] = next;
        }
        return updated;
      });
    },
    [pendingChanges, originalActiveOf],
  );

  const handleSelectAll = useCallback(() => {
    // Determine if all visible items are effectively active; if so, deselect
    // all, otherwise select all. Only affects the current page.
    const allActive = competitions.every(effectiveActiveOf);
    const targetActive = !allActive;
    setPendingChanges((prev) => {
      const updated = { ...prev };
      for (const c of competitions) {
        const original = originalActiveOf(c);
        if (targetActive === original) {
          delete updated[c.id];
        } else {
          updated[c.id] = targetActive;
        }
      }
      return updated;
    });
  }, [competitions, effectiveActiveOf, originalActiveOf]);

  const handleSaveChanges = async () => {
    try {
      setSaving(true);

      const updates = Object.entries(pendingChanges).map(([id, isActive]) => ({
        id,
        isActive,
      }));

      if (updates.length === 0) {
        alert("No changes to save!");
        setSaving(false);
        return;
      }

      const { data: result } = await ownerApi.updateCompetitionStatus(sportId, {
        competitions: updates,
      });

      if (result.success) {
        // Apply pending changes to currently-loaded competitions so the UI
        // reflects the new server state without a refetch.
        setCompetitions((prev) =>
          prev.map((competition) => {
            const change = pendingChanges[competition.id];
            if (change === undefined) return competition;
            if (isOwner) return { ...competition, isActive: change };
            return { ...competition, whitelabelActive: change };
          }),
        );
        setPendingChanges({});
        alert(`Updated ${updates.length} competition(s) successfully!`);
      } else {
        alert(`Failed: ${result.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardChanges = useCallback(() => {
    setPendingChanges({});
  }, []);

  const handleBackClick = () => {
    if (Object.keys(pendingChanges).length > 0) {
      if (
        confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        router.push(`${panelPrefix}/sports-games`);
      }
    } else {
      router.push(`${panelPrefix}/sports-games`);
    }
  };

  if (loading && competitions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading competitions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBackClick}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Sports
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {sportName || "Sport"} Competitions
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500">Sport ID: {sportId}</p>
              {isOwner && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                  Global Control
                </span>
              )}
              {isAdmin && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Whitelabel Control
                </span>
              )}
              {!canEdit && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  View Only
                </span>
              )}
            </div>
          </div>
          {canEdit && stats.pendingChanges > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleDiscardChanges}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                    <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {stats.pendingChanges}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Competitions</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {stats.totalAll}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active (this page)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.activeOnPage}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Showing</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {fromIndex}–{toIndex}
          </p>
        </div>
        {canEdit && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-600">Pending Changes</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {stats.pendingChanges}
            </p>
          </div>
        )}
      </div>

      {/* Search and Select All */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search competitions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          {canEdit && competitions.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              {competitions.every(effectiveActiveOf)
                ? "Deselect All"
                : "Select All"}{" "}
              ({competitions.length})
            </button>
          )}
        </div>
      </div>

      {/* Competitions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {competitions.map((competition) => {
          const original = originalActiveOf(competition);
          const isSelected = effectiveActiveOf(competition);
          const isChanged = canEdit && original !== isSelected;

          return (
            <div
              key={competition.id}
              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {canEdit ? (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleActive(competition)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                ) : (
                  <div
                    className={`h-3 w-3 rounded-full ${
                      original ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() =>
                    router.push(
                      `${panelPrefix}/sports-games/competitions/${sportId}/events/${competition.id}`,
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {competition.name}
                    </h3>
                    {isChanged && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Modified
                      </span>
                    )}
                    {isOwner && !competition.isActive && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Globally Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">ID: {competition.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    {competition.eventCount}
                  </p>
                  <p className="text-xs text-gray-500">Events</p>
                </div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTop(competition);
                    }}
                    disabled={togglingTopId === competition.id}
                    title={
                      competition.isTop
                        ? "Remove from sidebar 'Top competitions'"
                        : "Show in sidebar 'Top competitions'"
                    }
                    className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors disabled:opacity-60 disabled:cursor-wait whitespace-nowrap ${
                      competition.isTop
                        ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {togglingTopId === competition.id
                      ? "Saving…"
                      : competition.isTop
                        ? "★ Top"
                        : "☆ Top"}
                  </button>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isSelected
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isSelected ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          );
        })}

        {competitions.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No competitions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {debouncedSearch
                ? "Try adjusting your search terms"
                : "No competitions available for this sport"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-6 bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
          <p className="text-sm text-gray-600">
            {loading
              ? "Loading…"
              : `Showing ${fromIndex}–${toIndex} of ${totalCount}`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page >= totalPages - 1 || loading}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

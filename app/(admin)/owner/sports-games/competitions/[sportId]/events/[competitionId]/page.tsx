// app/owner/sports-games/competitions/[sportId]/events/[competitionId]/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCompetitionEvents, useUpdateEventStatus } from "@/hooks/useOwner";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";
import { ownerApi } from "@/lib/api";
import { formatLocal } from "@/lib/date-utils";

interface EventItem {
  id: string;
  eventId: number;
  name: string;
  openDate: string | null;
  isActive: boolean;
  isRecommended: boolean;
  whitelabelActive: boolean;
  defaultMarketId: string | null;
  suspended: boolean;
}

const PAGE_SIZE = 50;

function formatDate(dateString: string | null): string {
  if (!dateString) return "TBD";
  try {
    return formatLocal(dateString, "dd MMM yyyy, HH:mm");
  } catch {
    return "";
  }
}

export default function EventsPage() {
  const params = useParams();
  const router = useRouter();
  const sportId = params.sportId as string;
  const competitionId = params.competitionId as string;
  const { user: currentUser } = useAuth();
  const panelPrefix = usePanelPrefix();

  const isOwner = currentUser?.role === "owner";
  const isAdmin = currentUser?.role === "admin";
  const canEdit = isOwner || isAdmin;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  // Debounce search; reset to first page when search changes.
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const { data: response, isLoading: loading } = useCompetitionEvents(
    competitionId,
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE, search: debouncedSearch },
  );
  const updateStatus = useUpdateEventStatus();

  // Pending changes persist across page/search navigations so admins can
  // edit events on multiple pages before clicking Save.
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  // Optimistic overrides for the "Recommended" toggle — keyed by eventId.
  const [recommendedOverrides, setRecommendedOverrides] = useState<Record<string, boolean>>({});
  const [togglingRecommendedId, setTogglingRecommendedId] = useState<string | null>(null);

  const eventsData: EventItem[] = useMemo(() => {
    if (!response?.success || !Array.isArray(response.data)) return [];
    return response.data.map((evt: any) => {
      const id = String(evt.eventId);
      return {
        id,
        eventId: evt.eventId,
        name: evt.name,
        openDate: evt.openDate,
        isActive: evt.isActive ?? false,
        isRecommended: recommendedOverrides[id] ?? evt.isRecommended ?? false,
        whitelabelActive: evt.whitelabelActive ?? true,
        defaultMarketId: evt.defaultMarketId || null,
        suspended: evt.suspended ?? false,
      };
    });
  }, [response, recommendedOverrides]);

  const totalCount = Number(response?.totalCount ?? eventsData.length);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const fromIndex = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const toIndex = Math.min(totalCount, page * PAGE_SIZE + eventsData.length);

  const originalActiveOf = useCallback(
    (e: EventItem) => (isOwner ? e.isActive : e.whitelabelActive),
    [isOwner],
  );

  const effectiveActiveOf = useCallback(
    (e: EventItem) => pendingChanges[e.id] ?? originalActiveOf(e),
    [pendingChanges, originalActiveOf],
  );

  const stats = useMemo(() => {
    const activeOnPage = eventsData.filter(originalActiveOf).length;
    return {
      totalAll: totalCount,
      totalOnPage: eventsData.length,
      activeOnPage,
      pendingChanges: Object.keys(pendingChanges).length,
    };
  }, [eventsData, totalCount, pendingChanges, originalActiveOf]);

  const handleToggleRecommended = useCallback(
    async (evt: EventItem) => {
      if (!isOwner) return;
      if (togglingRecommendedId !== null) return;
      const next = !evt.isRecommended;
      setTogglingRecommendedId(evt.id);
      setRecommendedOverrides((prev) => ({ ...prev, [evt.id]: next }));
      try {
        await ownerApi.toggleRecommendedEvent(evt.eventId, next);
      } catch (err) {
        console.error("Failed to toggle recommended event:", err);
        setRecommendedOverrides((prev) => ({ ...prev, [evt.id]: evt.isRecommended }));
      } finally {
        setTogglingRecommendedId(null);
      }
    },
    [isOwner, togglingRecommendedId],
  );

  const handleToggleActive = useCallback(
    (evt: EventItem) => {
      const original = originalActiveOf(evt);
      const current = pendingChanges[evt.id] ?? original;
      const next = !current;
      setPendingChanges((prev) => {
        const updated = { ...prev };
        if (next === original) delete updated[evt.id];
        else updated[evt.id] = next;
        return updated;
      });
    },
    [pendingChanges, originalActiveOf],
  );

  const handleSelectAll = useCallback(() => {
    const allActive = eventsData.every(effectiveActiveOf);
    const targetActive = !allActive;
    setPendingChanges((prev) => {
      const updated = { ...prev };
      for (const e of eventsData) {
        const original = originalActiveOf(e);
        if (targetActive === original) delete updated[e.id];
        else updated[e.id] = targetActive;
      }
      return updated;
    });
  }, [eventsData, effectiveActiveOf, originalActiveOf]);

  const handleSaveChanges = async () => {
    const updates = Object.entries(pendingChanges).map(([id, isActive]) => ({
      id,
      isActive,
    }));
    if (updates.length === 0) return;
    updateStatus.mutate(
      { competitionId, events: updates },
      {
        onSuccess: () => setPendingChanges({}),
      },
    );
  };

  const handleDiscardChanges = useCallback(() => {
    setPendingChanges({});
  }, []);

  const handleEventClick = (eventId: string) => {
    router.push(`${panelPrefix}/market-management?eventId=${eventId}`);
  };

  const handleBackClick = () => {
    if (Object.keys(pendingChanges).length > 0) {
      if (!confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    }
    router.push(`${panelPrefix}/sports-games/competitions/${sportId}`);
  };

  if (loading && eventsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  const competitionName = response?.competitionName || "Competition";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBackClick}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Competitions
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {competitionName} Events
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500">Competition ID: {competitionId}</p>
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
                disabled={updateStatus.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {updateStatus.isPending ? (
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
          <p className="text-sm text-gray-600">Total Events</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalAll}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Active (this page)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeOnPage}</p>
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
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingChanges}</p>
          </div>
        )}
      </div>

      {/* Search and Select All */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          {canEdit && eventsData.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              {eventsData.every(effectiveActiveOf) ? "Deselect All" : "Select All"}{" "}
              ({eventsData.length})
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {eventsData.map((evt) => {
          const original = originalActiveOf(evt);
          const isSelected = effectiveActiveOf(evt);
          const isChanged = canEdit && original !== isSelected;

          return (
            <div
              key={evt.id}
              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {canEdit ? (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleActive(evt)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                ) : (
                  <div
                    className={`h-3 w-3 rounded-full ${original ? "bg-green-500" : "bg-gray-300"}`}
                  />
                )}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleEventClick(evt.id)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate">{evt.name}</h3>
                    {isChanged && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Modified
                      </span>
                    )}
                    {evt.suspended && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Suspended
                      </span>
                    )}
                    {isOwner && !evt.isActive && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Globally Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-sm text-gray-500">ID: {evt.id}</p>
                    <p className="text-sm text-gray-400">{formatDate(evt.openDate)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isOwner && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRecommended(evt);
                    }}
                    disabled={togglingRecommendedId === evt.id}
                    title={
                      evt.isRecommended
                        ? "Remove from sidebar 'Recommended'"
                        : "Show in sidebar 'Recommended'"
                    }
                    className={`px-3 py-1 rounded-md text-xs font-semibold border transition-colors disabled:opacity-60 disabled:cursor-wait whitespace-nowrap ${
                      evt.isRecommended
                        ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {togglingRecommendedId === evt.id
                      ? "Saving…"
                      : evt.isRecommended
                        ? "★ Recommended"
                        : "☆ Recommend"}
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

        {eventsData.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {debouncedSearch
                ? "Try adjusting your search terms"
                : "No events available for this competition. Events will appear after the competition is activated."}
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
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
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

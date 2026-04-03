// app/owner/sports-games/competitions/[sportId]/events/[competitionId]/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCompetitionEvents, useUpdateEventStatus } from "@/hooks/useOwner";
import { usePanelPrefix } from "@/hooks/usePanelPrefix";

interface EventItem {
  id: string;
  eventId: number;
  name: string;
  openDate: string | null;
  isActive: boolean;
  whitelabelActive: boolean;
  defaultMarketId: string | null;
  suspended: boolean;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "TBD";
  try {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
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

  const { data: response, isLoading: loading } = useCompetitionEvents(competitionId);
  const updateStatus = useUpdateEventStatus();

  const [search, setSearch] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const eventsData: EventItem[] = useMemo(() => {
    if (!response?.success || !Array.isArray(response.data)) return [];
    return response.data.map((evt: any) => ({
      id: String(evt.eventId),
      eventId: evt.eventId,
      name: evt.name,
      openDate: evt.openDate,
      isActive: evt.isActive ?? false,
      whitelabelActive: evt.whitelabelActive ?? true,
      defaultMarketId: evt.defaultMarketId || null,
      suspended: evt.suspended ?? false,
    }));
  }, [response]);

  // Sort: active first, then by date
  const sortedEvents = useMemo(() => {
    return [...eventsData].sort((a, b) => {
      const aActive = isOwner ? a.isActive : a.whitelabelActive;
      const bActive = isOwner ? b.isActive : b.whitelabelActive;
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      const dateA = a.openDate ? new Date(a.openDate).getTime() : 0;
      const dateB = b.openDate ? new Date(b.openDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [eventsData, isOwner]);

  // Initialize selection from current active state
  if (!initialized && sortedEvents.length > 0) {
    const activeIds = sortedEvents
      .filter((e) => (isOwner ? e.isActive : e.whitelabelActive))
      .map((e) => e.id);
    setSelectedEvents(activeIds);
    setInitialized(true);
  }

  const filteredEvents = useMemo(() => {
    return sortedEvents.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [sortedEvents, search]);

  const changedEvents = useMemo(() => {
    const changes: Array<{ id: string; isActive: boolean }> = [];
    sortedEvents.forEach((evt) => {
      const isNowActive = selectedEvents.includes(evt.id);
      const wasActive = isOwner ? evt.isActive : evt.whitelabelActive;
      if (wasActive !== isNowActive) {
        changes.push({ id: evt.id, isActive: isNowActive });
      }
    });
    return changes;
  }, [sortedEvents, selectedEvents, isOwner]);

  const stats = useMemo(
    () => ({
      total: sortedEvents.length,
      active: sortedEvents.filter((e) =>
        isOwner ? e.isActive : e.whitelabelActive,
      ).length,
      selected: selectedEvents.length,
      changes: changedEvents.length,
    }),
    [sortedEvents, selectedEvents, changedEvents, isOwner],
  );

  const handleSelectEvent = useCallback((eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedEvents.length === filteredEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(filteredEvents.map((e) => e.id));
    }
  }, [selectedEvents.length, filteredEvents]);

  const handleSaveChanges = async () => {
    if (changedEvents.length === 0) return;
    updateStatus.mutate(
      { competitionId, events: changedEvents },
      {
        onSuccess: () => {
          setInitialized(false); // Re-initialize from fresh data
        },
      },
    );
  };

  const handleDiscardChanges = useCallback(() => {
    const activeIds = sortedEvents
      .filter((e) => (isOwner ? e.isActive : e.whitelabelActive))
      .map((e) => e.id);
    setSelectedEvents(activeIds);
  }, [sortedEvents, isOwner]);

  const handleEventClick = (eventId: string) => {
    router.push(`${panelPrefix}/market-management?eventId=${eventId}`);
  };

  const handleBackClick = () => {
    if (changedEvents.length > 0) {
      if (!confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    }
    router.push(`${panelPrefix}/sports-games/competitions/${sportId}`);
  };

  if (loading) {
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
          {canEdit && stats.changes > 0 && (
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
                      {stats.changes}
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
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Currently Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
        </div>
        {canEdit && (
          <>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Selected</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.selected}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-600">Pending Changes</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.changes}</p>
            </div>
          </>
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
          {canEdit && (
            <button
              onClick={handleSelectAll}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              {selectedEvents.length === filteredEvents.length ? "Deselect All" : "Select All"}{" "}
              ({filteredEvents.length})
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredEvents.map((evt) => {
          const currentActive = isOwner ? evt.isActive : evt.whitelabelActive;
          const isSelected = selectedEvents.includes(evt.id);
          const isChanged = canEdit && currentActive !== isSelected;

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
                    onChange={() => handleSelectEvent(evt.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                ) : (
                  <div
                    className={`h-3 w-3 rounded-full ${currentActive ? "bg-green-500" : "bg-gray-300"}`}
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
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    canEdit
                      ? isSelected
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                      : currentActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {canEdit
                    ? isSelected ? "Active" : "Inactive"
                    : currentActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search
                ? "Try adjusting your search terms"
                : "No events available for this competition. Events will appear after the competition is activated."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

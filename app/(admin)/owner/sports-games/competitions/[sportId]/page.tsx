// app/owner/sports-games/competitions/[sportId]/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

interface Competition {
  id: string;
  name: string;
  sportId: string;
  totalEvents: number;
  isActive: boolean;
  competition_id?: string;
  sport_id?: string;
  is_active?: boolean;
  metadata?: any;
}

export default function CompetitionsPage() {
  const params = useParams();
  const router = useRouter();
  const sportId = params.sportId as string;

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sportName, setSportName] = useState("");
  const [selectedCompetitions, setSelectedCompetitions] = useState<string[]>(
    [],
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/competitions/${sportId}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        let competitionsData: Competition[] = [];
        if (Array.isArray(data.data)) {
          competitionsData = data.data.map((comp) => ({
            id: comp.competition_id || comp.id,
            name: comp.name,
            sportId: comp.sport_id || comp.sportId,
            totalEvents: comp.totalEvents || comp.metadata?.totalEvents || 0,
            isActive: comp.is_active || comp.isActive || false,
          }));
          setSportName(data.sportName || "");
        }

        // Sort competitions: active ones first, then by name
        const sortedCompetitions = [...competitionsData].sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return a.name.localeCompare(b.name);
        });

        setCompetitions(sortedCompetitions);

        // Auto-select active competitions
        const activeIds = competitionsData
          .filter((comp) => comp.isActive)
          .map((comp) => comp.id);
        setSelectedCompetitions(activeIds);
      } catch (error) {
        console.error("Error fetching competitions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sportId) {
      fetchCompetitions();
    }
  }, [sportId]);

  // Memoize filtered competitions
  const filteredCompetitions = useMemo(() => {
    return competitions.filter((competition) =>
      competition.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [competitions, search]);

  // Memoize changed competitions calculation
  const changedCompetitions = useMemo(() => {
    const changes: Array<{ id: string; isActive: boolean }> = [];
    competitions.forEach((competition) => {
      const isNowActive = selectedCompetitions.includes(competition.id);
      if (competition.isActive !== isNowActive) {
        changes.push({
          id: competition.id,
          isActive: isNowActive,
        });
      }
    });
    return changes;
  }, [competitions, selectedCompetitions]);

  // Memoize stats
  const stats = useMemo(
    () => ({
      total: competitions.length,
      active: competitions.filter((c) => c.isActive).length,
      selected: selectedCompetitions.length,
      changes: changedCompetitions.length,
    }),
    [competitions, selectedCompetitions, changedCompetitions],
  );

  // Optimize checkbox handler with useCallback
  const handleSelectCompetition = useCallback((competitionId: string) => {
    setSelectedCompetitions((prev) => {
      if (prev.includes(competitionId)) {
        return prev.filter((id) => id !== competitionId);
      } else {
        return [...prev, competitionId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedCompetitions.length === filteredCompetitions.length) {
      setSelectedCompetitions([]);
    } else {
      const allIds = filteredCompetitions.map((comp) => comp.id);
      setSelectedCompetitions(allIds);
    }
  }, [selectedCompetitions.length, filteredCompetitions]);

  const handleSaveChanges = async () => {
    try {
      setSaving(true);

      if (changedCompetitions.length === 0) {
        alert("No changes to save!");
        setSaving(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/competitions/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sportId,
            competitions: changedCompetitions,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        const updatedCompetitions = competitions.map((competition) => {
          const change = changedCompetitions.find(
            (c) => c.id === competition.id,
          );
          if (change) {
            return { ...competition, isActive: change.isActive };
          }
          return competition;
        });

        const sortedUpdated = [...updatedCompetitions].sort((a, b) => {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          return a.name.localeCompare(b.name);
        });

        setCompetitions(sortedUpdated);
        alert(
          `Updated ${changedCompetitions.length} competition(s) successfully!`,
        );
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
    const activeIds = competitions
      .filter((comp) => comp.isActive)
      .map((comp) => comp.id);
    setSelectedCompetitions(activeIds);
  }, [competitions]);

  const handleBackClick = () => {
    if (changedCompetitions.length > 0) {
      if (
        confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        router.push("/owner/sports-games");
      }
    } else {
      router.push("/owner/sports-games");
    }
  };

  if (loading) {
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
            <p className="text-sm text-gray-500 mt-1">Sport ID: {sportId}</p>
          </div>
          {stats.changes > 0 && (
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
                    {stats.changes > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {stats.changes}
                      </span>
                    )}
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
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Currently Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.active}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Selected</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.selected}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Pending Changes</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {stats.changes}
          </p>
        </div>
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
          <button
            onClick={handleSelectAll}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            {selectedCompetitions.length === filteredCompetitions.length
              ? "Deselect All"
              : "Select All"}{" "}
            ({filteredCompetitions.length})
          </button>
        </div>
      </div>

      {/* Competitions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredCompetitions.map((competition) => {
          const isSelected = selectedCompetitions.includes(competition.id);
          const isChanged = competition.isActive !== isSelected;

          return (
            <div
              key={competition.id}
              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectCompetition(competition.id)}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      {competition.name}
                    </h3>
                    {isChanged && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                        Modified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">ID: {competition.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    {competition.totalEvents}
                  </p>
                  <p className="text-xs text-gray-500">Events</p>
                </div>
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

        {filteredCompetitions.length === 0 && (
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
              {search
                ? "Try adjusting your search terms"
                : "No competitions available for this sport"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

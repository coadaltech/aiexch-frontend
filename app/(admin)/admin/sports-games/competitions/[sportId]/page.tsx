// app/admin/sports-games/competitions/[sportId]/page.tsx
"use client";

import { useState, useEffect } from "react";
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

  // Filter competitions based on search (NO SORTING HERE)
  const filteredCompetitions = competitions.filter((competition) =>
    competition.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectCompetition = (competitionId: string) => {
    setSelectedCompetitions((prev) => {
      if (prev.includes(competitionId)) {
        return prev.filter((id) => id !== competitionId);
      } else {
        return [...prev, competitionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCompetitions.length === filteredCompetitions.length) {
      // Deselect all
      setSelectedCompetitions([]);
    } else {
      // Select all
      const allIds = filteredCompetitions.map((comp) => comp.id);
      setSelectedCompetitions(allIds);
    }
  };

  const getChangedCompetitions = () => {
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
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const changedCompetitions = getChangedCompetitions();

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
        // Update local state with new active status
        const updatedCompetitions = competitions.map((competition) => {
          const change = changedCompetitions.find(
            (c) => c.id === competition.id,
          );
          if (change) {
            return { ...competition, isActive: change.isActive };
          }
          return competition;
        });

        // Re-sort: active ones first, then by name
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

  const handleDiscardChanges = () => {
    const activeIds = competitions
      .filter((comp) => comp.isActive)
      .map((comp) => comp.id);
    setSelectedCompetitions(activeIds);
  };

  const hasChanges = () => getChangedCompetitions().length > 0;
  const changeCount = getChangedCompetitions().length;

  const handleBackClick = () => {
    if (hasChanges()) {
      if (
        confirm("You have unsaved changes. Are you sure you want to leave?")
      ) {
        router.push("/admin/sports-games");
      }
    } else {
      router.push("/admin/sports-games");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <div className="text-lg text-gray-700">Loading competitions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={handleBackClick}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
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
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {sportName || "Sport"} Competitions
              </h1>
              <p className="text-sm text-gray-500">Sport ID: {sportId}</p>
            </div>

            {hasChanges() && (
              <div className="flex gap-3">
                <button
                  onClick={handleDiscardChanges}
                  className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Changes
                      {changeCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {changeCount}
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
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Total Competitions
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {competitions.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Currently Active
            </div>
            <div className="text-3xl font-bold text-green-600">
              {competitions.filter((c) => c.isActive).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Selected
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {selectedCompetitions.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5">
            <div className="text-sm font-medium text-gray-500 mb-1">
              Pending Changes
            </div>
            <div className="text-3xl font-bold text-orange-600">
              {changeCount}
            </div>
          </div>
        </div>

        {/* Search and Select All */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
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
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              {selectedCompetitions.length === filteredCompetitions.length
                ? "Deselect All"
                : "Select All"}{" "}
              <span className="text-gray-500">
                ({filteredCompetitions.length})
              </span>
            </button>
          </div>
        </div>

        {/* Competitions List */}
        <div className="space-y-3">
          {filteredCompetitions.map((competition) => {
            const isSelected = selectedCompetitions.includes(competition.id);
            const isChanged = competition.isActive !== isSelected;

            return (
              <div
                key={competition.id}
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectCompetition(competition.id)}
                    className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                        {competition.name}
                      </h3>
                      {isChanged && (
                        <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Modified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      ID: {competition.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {competition.totalEvents}
                      </div>
                      <div className="text-xs text-gray-500">Events</div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                        isSelected
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isSelected ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCompetitions.length === 0 && (
            <div className="bg-white rounded-lg p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-900 text-lg font-medium mb-1">
                No competitions found
              </p>
              <p className="text-gray-500 text-sm">
                {search
                  ? "Try adjusting your search terms"
                  : "No competitions available for this sport"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

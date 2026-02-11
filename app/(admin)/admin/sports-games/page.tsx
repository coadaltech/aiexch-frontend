"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Sport {
  id: string;
  name: string;
  totalCompetitions: number;
  isActive: boolean;
}

export default function SportsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sports from API
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/dashboard/sports-list`,
        );
        const data = await response.json();

        if (Array.isArray(data)) {
          setSports(data);
        } else if (data.data && Array.isArray(data.data)) {
          setSports(data.data);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSports();
  }, []);

  // Filter sports
  const filteredSports = sports.filter((sport) =>
    sport.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Handle sport click
  const handleSportClick = (sportId: string) => {
    router.push(`/admin/sports-games/competitions/${sportId}`);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sports Games</h1>
          <p className="text-gray-600 mt-1">List of all available sports</p>
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
        <div className="space-y-4">
          {filteredSports.map((sport) => (
            <div
              key={sport.id}
              onClick={() => handleSportClick(sport.id)}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer hover:bg-blue-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    {sport.name}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    ID: {sport.id} • {sport.totalCompetitions} competitions
                  </p>
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
              <p className="text-2xl font-bold text-gray-800">
                {sports.length}
              </p>
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

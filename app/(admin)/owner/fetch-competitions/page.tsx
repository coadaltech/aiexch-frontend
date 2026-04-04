"use client";
import { useState } from "react";
import { ownerApi } from "@/lib/api";

export default function FetchCompetitionsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await ownerApi.syncCompetitions();
      setResult(response.data?.data || response.data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Failed to sync competitions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Fetch All Competitions
          </h1>
          <p className="text-gray-600 mt-1">
            Sync all competitions from the external API for every sport in the
            database.
          </p>
        </div>

        <button
          onClick={handleSync}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Syncing..." : "Fetch All Competitions"}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">
              Sync Complete
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Sports</p>
                <p className="text-xl font-bold text-gray-800">
                  {result.totalSports ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Competitions</p>
                <p className="text-xl font-bold text-gray-800">
                  {result.totalCompetitions ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Added</p>
                <p className="text-xl font-bold text-green-600">
                  {result.added ?? "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Errors</p>
                <p className="text-xl font-bold text-red-600">
                  {result.errors ?? "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

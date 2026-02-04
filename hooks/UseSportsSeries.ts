// hooks/useSportsSeries.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export function UseSportsSeries(eventTypeId: string) {
  const [seriesData, setSeriesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeriesData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sports/series/${eventTypeId}`,
      );

      if (response.data.success && response.data.data) {
        setSeriesData(response.data.data);
      } else {
        setSeriesData([]);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      setSeriesData([]);
    } finally {
      setLoading(false);
    }
  }, [eventTypeId]);


  useEffect(() => {
    fetchSeriesData();
    // Refresh every 30 seconds
    
    const intervalId = setInterval(fetchSeriesData, 15000);
    return () => clearInterval(intervalId);
  }, [fetchSeriesData]);

  return {
    seriesData,
    loading,
    error,
    refetch: fetchSeriesData,
  };
}

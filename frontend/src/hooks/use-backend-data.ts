import { useState, useEffect } from "react";
import {
  getAnalytics,
  getHotspots,
  getHistory,
  AnalyticsData,
  Hotspot,
  HistoryItem,
} from "@/lib/api";

export function useBackendData() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [analyticsRes, hotspotsRes, historyRes] = await Promise.all([
        getAnalytics(),
        getHotspots(),
        getHistory(),
      ]);
      setAnalytics(analyticsRes);
      setHotspots(hotspotsRes);
      setHistory(historyRes);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch backend data:", err);
      setError("Backend API offline. Using fallback simulation data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { analytics, hotspots, history, loading, error, refresh };
}

"use client";

import { useState, useEffect, useCallback } from "react";

export interface BackendHealth {
  status: "healthy" | "offline" | "checking";
  version?: string;
  service?: string;
  uptimeSeconds?: number;
  lastChecked?: string;
  error?: string;
}

export function useBackendStatus() {
  const [health, setHealth] = useState<BackendHealth>({
    status: "checking",
  });

  const checkHealth = useCallback(async () => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${backendUrl}/health`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setHealth({
          status: "healthy",
          version: data.version,
          service: data.service,
          uptimeSeconds: data.uptime_seconds,
          lastChecked: new Date().toLocaleTimeString(),
        });
      } else {
        setHealth({
          status: "offline",
          error: `HTTP ${res.status}`,
          lastChecked: new Date().toLocaleTimeString(),
        });
      }
    } catch {
      setHealth({
        status: "offline",
        error: "Connection refused",
        lastChecked: new Date().toLocaleTimeString(),
      });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, refetch: checkHealth };
}

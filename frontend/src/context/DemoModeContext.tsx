"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

interface DemoModeContextValue {
  isDemoMode: boolean;
  toggleDemoMode: (val: boolean) => void;
  demoData: Record<string, any[]> | null;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<Record<string, any[]> | null>(
    null
  );

  useEffect(() => {
    // Persist demo mode choice
    const saved =
      localStorage.getItem("gestura_demo_mode") === "true";

    setIsDemoMode(saved);

    // Fetch demo data asynchronously
    fetch("/data/demo_sequences.json")
      .then((res) => res.json())
      .then((data) => setDemoData(data))
      .catch(() =>
        console.warn(
          "Demo data not found. Run make_demo_data.py first."
        )
      );
  }, []);

  const toggleDemoMode = (val: boolean) => {
    setIsDemoMode(val);
    localStorage.setItem("gestura_demo_mode", val.toString());
  };

  return (
    <DemoModeContext.Provider
      value={{ isDemoMode, toggleDemoMode, demoData }}
    >
      {isDemoMode && (
        <div className="fixed top-0 left-0 w-full bg-warning text-ink text-center text-xs font-black py-1 z-50 shadow-md">
          DEMO MODE — Prerecorded sample data. Inference is live but input
          is recorded. Events are tagged source=&apos;demo&apos;.
        </div>
      )}

      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);

  if (!context) {
    throw new Error(
      "useDemoMode must be used within DemoModeProvider"
    );
  }

  return context;
}
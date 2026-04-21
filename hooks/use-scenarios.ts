"use client";
/**
 * use-scenarios.ts
 * React hook for managing mortgage scenario list with URL sync + localStorage.
 * Init order: URL param → localStorage → default 2 example scenarios.
 * URL is updated via replaceState (no navigation) debounced at 500ms.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  MortgageScenario,
  serializeScenariosToURL,
  deserializeScenariosFromURL,
  saveToLocalStorage,
  loadFromLocalStorage,
  getDefaultScenarios,
  generateScenarioId,
} from "@/lib/state/scenarios-store";

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface UseScenariosReturn {
  scenarios: MortgageScenario[];
  addScenario: (scenario?: Partial<MortgageScenario>) => void;
  removeScenario: (id: string) => void;
  updateScenario: (id: string, updates: Partial<MortgageScenario>) => void;
  resetScenarios: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useScenarios(): UseScenariosReturn {
  const [scenarios, setScenarios] = useState<MortgageScenario[]>(() => {
    // SSR safe — return empty, hydrate in useEffect
    return [];
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Hydrate from URL → localStorage → defaults (client only)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("s");

    const fromURL = urlParam ? deserializeScenariosFromURL(urlParam) : null;
    if (fromURL && fromURL.length > 0) {
      setScenarios(fromURL);
      return;
    }

    const fromLS = loadFromLocalStorage();
    if (fromLS && fromLS.length > 0) {
      setScenarios(fromLS);
      return;
    }

    setScenarios(getDefaultScenarios());
  }, []);

  // -------------------------------------------------------------------------
  // Sync to URL + localStorage whenever scenarios change (debounced 500ms)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (scenarios.length === 0) return; // skip initial empty state

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      // Persist to localStorage immediately (inside debounce is fine)
      saveToLocalStorage(scenarios);

      // Update URL without navigation
      if (typeof window !== "undefined") {
        const encoded = serializeScenariosToURL(scenarios);
        const url = new URL(window.location.href);
        url.searchParams.set("s", encoded);
        window.history.replaceState(null, "", url.toString());
      }
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [scenarios]);

  // -------------------------------------------------------------------------
  // Mutations — all return new arrays (immutable pattern)
  // -------------------------------------------------------------------------

  const addScenario = useCallback(
    (partial?: Partial<MortgageScenario>) => {
      const base = scenarios[0] ?? getDefaultScenarios()[0];
      const newScenario: MortgageScenario = {
        ...base,
        id: generateScenarioId(),
        label: `Kịch bản ${scenarios.length + 1}`,
        ...partial,
      };
      setScenarios((prev) => [...prev, newScenario]);
    },
    [scenarios]
  );

  const removeScenario = useCallback((id: string) => {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const updateScenario = useCallback(
    (id: string, updates: Partial<MortgageScenario>) => {
      setScenarios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const resetScenarios = useCallback(() => {
    setScenarios(getDefaultScenarios());
  }, []);

  return {
    scenarios,
    addScenario,
    removeScenario,
    updateScenario,
    resetScenarios,
  };
}

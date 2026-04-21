/**
 * scenarios-store.ts
 * Pure functions + types for mortgage scenario list management.
 * Handles URL serialization, localStorage persistence, and ID generation.
 * No React dependencies — safe to import in server or client contexts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MortgageScenario {
  id: string;
  label: string;
  homePrice: number;
  downPayment: number;
  rate: number; // annual percentage, e.g. 6.75
  termYears: number; // 15 | 20 | 30
  propertyTax: number; // annual amount
  insurance: number; // annual amount
  pmi: number; // monthly amount (0 if not applicable)
  hoa: number; // monthly amount
}

// ---------------------------------------------------------------------------
// ID generation (6-char alphanumeric, no external dependency)
// ---------------------------------------------------------------------------

const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateScenarioId(): string {
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return id;
}

// ---------------------------------------------------------------------------
// URL serialization — base64url encoded JSON as a single query param
// ---------------------------------------------------------------------------

/** Encode scenarios array → compact base64url string */
export function serializeScenariosToURL(scenarios: MortgageScenario[]): string {
  try {
    const json = JSON.stringify(scenarios);
    // btoa works in browser; use Buffer fallback for Node (SSR)
    if (typeof btoa !== "undefined") {
      return btoa(json)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    }
    // Node / SSR path
    return Buffer.from(json, "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch {
    return "";
  }
}

/** Decode base64url string → scenarios array or null on failure */
export function deserializeScenariosFromURL(
  param: string
): MortgageScenario[] | null {
  if (!param) return null;
  try {
    // Re-pad base64url to standard base64
    const base64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

    let json: string;
    if (typeof atob !== "undefined") {
      json = atob(padded);
    } else {
      json = Buffer.from(padded, "base64").toString("utf-8");
    }

    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return null;
    return parsed as MortgageScenario[];
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// localStorage persistence — SSR-safe (checks typeof window)
// ---------------------------------------------------------------------------

const LS_KEY = "mortgage-compare-scenarios-v1";

export function saveToLocalStorage(scenarios: MortgageScenario[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(scenarios));
  } catch {
    // quota exceeded or private browsing — silently skip
  }
}

export function loadFromLocalStorage(): MortgageScenario[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as MortgageScenario[];
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Default example scenarios (shown on first visit)
// ---------------------------------------------------------------------------

export function getDefaultScenarios(): MortgageScenario[] {
  return [
    {
      id: generateScenarioId(),
      label: "Conventional 30yr",
      homePrice: 350000,
      downPayment: 70000, // 20%
      rate: 7.0,
      termYears: 30,
      propertyTax: 5250, // ~1.5% of home price (TX avg)
      insurance: 1400, // annual
      pmi: 0,
      hoa: 0,
    },
    {
      id: generateScenarioId(),
      label: "FHA 30yr",
      homePrice: 350000,
      downPayment: 12250, // 3.5%
      rate: 6.75,
      termYears: 30,
      propertyTax: 5250,
      insurance: 1400,
      pmi: 175, // monthly MIP estimate
      hoa: 0,
    },
  ];
}

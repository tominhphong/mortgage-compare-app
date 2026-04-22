/**
 * device-id.ts
 * Anonymous device identifier stored in localStorage.
 * Used by cloud sync to namespace scenarios per device without requiring auth.
 */

const STORAGE_KEY = "mortgage-device-id";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback — RFC4122 v4 via Math.random (SSR path)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Get the device ID, creating one on first call. SSR-safe (returns empty string server-side). */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const fresh = generateUUID();
    window.localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // localStorage blocked (private mode etc.) — return ephemeral ID
    return generateUUID();
  }
}

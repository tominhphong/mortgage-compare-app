/**
 * scenario-sync.ts
 * Fetch wrapper for Cloudflare Worker scenarios API.
 * Cloud sync is opt-in: when NEXT_PUBLIC_API_BASE is empty, all calls return
 * `cloudEnabled: false` without network activity. localStorage stays source of truth.
 */

/**
 * Payload accepted by the cloud save API. Shape-agnostic so either
 * the legacy `MortgageScenario` store or the app's current `MortgageInput`
 * can round-trip through D1 without coupling this module to a specific schema.
 */
export interface CloudScenarioPayload {
  label: string;
  inputs: Record<string, unknown>;
}

export interface CloudScenarioRecord {
  id: string;
  device_id: string;
  label: string;
  inputs_json: string;
  outputs_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SyncResult<T> {
  cloudEnabled: boolean;
  ok: boolean;
  data?: T;
  error?: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE ?? "").replace(/\/+$/, "");

export function isCloudEnabled(): boolean {
  return API_BASE.length > 0;
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<SyncResult<T>> {
  if (!isCloudEnabled()) {
    return { cloudEnabled: false, ok: false, error: "cloud disabled" };
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const body = (await res.json()) as ApiEnvelope<T>;
    if (!res.ok || !body.success) {
      return {
        cloudEnabled: true,
        ok: false,
        error: body.error ?? `HTTP ${res.status}`,
      };
    }
    return { cloudEnabled: true, ok: true, data: body.data };
  } catch (err) {
    return {
      cloudEnabled: true,
      ok: false,
      error: err instanceof Error ? err.message : "network error",
    };
  }
}

export function saveScenarioCloud(
  deviceId: string,
  payload: CloudScenarioPayload
): Promise<SyncResult<CloudScenarioRecord>> {
  return apiFetch<CloudScenarioRecord>("/api/scenarios", {
    method: "POST",
    body: JSON.stringify({
      device_id: deviceId,
      label: payload.label,
      inputs_json: JSON.stringify(payload.inputs),
      outputs_json: null,
    }),
  });
}

export function listScenariosCloud(
  deviceId: string
): Promise<SyncResult<CloudScenarioRecord[]>> {
  const q = encodeURIComponent(deviceId);
  return apiFetch<CloudScenarioRecord[]>(`/api/scenarios?device_id=${q}`);
}

export function getScenarioCloud(
  id: string
): Promise<SyncResult<CloudScenarioRecord>> {
  return apiFetch<CloudScenarioRecord>(`/api/scenarios/${encodeURIComponent(id)}`);
}

export function deleteScenarioCloud(id: string): Promise<SyncResult<null>> {
  return apiFetch<null>(`/api/scenarios/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/** Parse a cloud record's inputs_json back into a structured object. */
export function parseCloudScenario<T = Record<string, unknown>>(
  record: CloudScenarioRecord
): T | null {
  try {
    return JSON.parse(record.inputs_json) as T;
  } catch {
    return null;
  }
}

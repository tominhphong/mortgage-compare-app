/**
 * use-cloud-scenarios.ts
 * React hook managing cloud-synced mortgage scenarios.
 * Gracefully degrades when NEXT_PUBLIC_API_BASE is not set.
 */

"use client";

import * as React from "react";
import {
  deleteScenarioCloud,
  isCloudEnabled,
  listScenariosCloud,
  parseCloudScenario,
  saveScenarioCloud,
  type CloudScenarioPayload,
  type CloudScenarioRecord,
} from "@/lib/scenario-sync";
import { getOrCreateDeviceId } from "@/lib/device-id";

interface State {
  records: CloudScenarioRecord[];
  loading: boolean;
  error: string | null;
}

export function useCloudScenarios() {
  const cloudEnabled = isCloudEnabled();
  const [deviceId, setDeviceId] = React.useState<string>("");
  const [state, setState] = React.useState<State>({
    records: [],
    loading: false,
    error: null,
  });

  React.useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  const refresh = React.useCallback(async () => {
    if (!cloudEnabled || !deviceId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    const result = await listScenariosCloud(deviceId);
    setState({
      records: result.data ?? [],
      loading: false,
      error: result.ok ? null : result.error ?? "unknown error",
    });
  }, [cloudEnabled, deviceId]);

  React.useEffect(() => {
    if (cloudEnabled && deviceId) {
      void refresh();
    }
  }, [cloudEnabled, deviceId, refresh]);

  const save = React.useCallback(
    async (payload: CloudScenarioPayload) => {
      if (!cloudEnabled || !deviceId) {
        return { ok: false, error: "cloud disabled" };
      }
      const result = await saveScenarioCloud(deviceId, payload);
      if (result.ok) {
        await refresh();
      }
      return { ok: result.ok, error: result.error };
    },
    [cloudEnabled, deviceId, refresh]
  );

  const remove = React.useCallback(
    async (id: string) => {
      if (!cloudEnabled) return { ok: false, error: "cloud disabled" };
      const result = await deleteScenarioCloud(id);
      if (result.ok) {
        await refresh();
      }
      return { ok: result.ok, error: result.error };
    },
    [cloudEnabled, refresh]
  );

  const loadAsScenario = React.useCallback(
    <T = Record<string, unknown>>(record: CloudScenarioRecord): T | null => {
      return parseCloudScenario<T>(record);
    },
    []
  );

  return {
    cloudEnabled,
    deviceId,
    records: state.records,
    loading: state.loading,
    error: state.error,
    save,
    remove,
    refresh,
    loadAsScenario,
  };
}

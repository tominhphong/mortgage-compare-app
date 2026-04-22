"use client";
/**
 * SaveCloudButton.tsx
 * Saves the currently active scenario to Cloudflare D1 via Worker API.
 * Renders nothing when cloud sync is disabled (NEXT_PUBLIC_API_BASE empty).
 * Bilingual labels, matches ShareLinkButton UX pattern.
 */

import { useCallback, useState } from "react";
import { useCloudScenarios } from "@/hooks/use-cloud-scenarios";
import type { CloudScenarioPayload } from "@/lib/scenario-sync";
import type { Language } from "@/lib/i18n/translations";

interface SaveCloudButtonProps {
  payload: CloudScenarioPayload | null;
  language?: Language;
  className?: string;
}

const LABELS = {
  vi: {
    idle: "Lưu vào Cloud",
    saving: "Đang lưu...",
    success: "Đã lưu!",
    fail: "Không lưu được",
    noScenario: "Chưa có kịch bản",
  },
  en: {
    idle: "Save to Cloud",
    saving: "Saving...",
    success: "Saved!",
    fail: "Save failed",
    noScenario: "No scenario",
  },
} as const;

export default function SaveCloudButton({
  payload,
  language = "vi",
  className = "",
}: SaveCloudButtonProps) {
  const { cloudEnabled, save } = useCloudScenarios();
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "fail">(
    "idle"
  );

  const handleSave = useCallback(async () => {
    if (!payload) return;
    setStatus("saving");
    const result = await save(payload);
    setStatus(result.ok ? "success" : "fail");
    setTimeout(() => setStatus("idle"), 2000);
  }, [payload, save]);

  if (!cloudEnabled) return null;

  const t = LABELS[language];
  const label =
    status === "saving"
      ? t.saving
      : status === "success"
        ? t.success
        : status === "fail"
          ? t.fail
          : !payload
            ? t.noScenario
            : t.idle;

  const baseClasses =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50";
  const colorClasses =
    status === "success"
      ? "bg-emerald-600 text-white"
      : status === "fail"
        ? "bg-rose-600 text-white"
        : "bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300";

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={!payload || status === "saving"}
      className={`${baseClasses} ${colorClasses} ${className}`.trim()}
    >
      {label}
    </button>
  );
}

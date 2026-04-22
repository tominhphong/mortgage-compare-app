"use client";
/**
 * CloudScenariosList.tsx
 * Collapsible panel showing scenarios saved to Cloudflare D1.
 * User can load a saved scenario back into the app or delete it.
 * Hidden entirely when cloud sync is disabled.
 */

import { useState } from "react";
import { useCloudScenarios } from "@/hooks/use-cloud-scenarios";
import type { Language } from "@/lib/i18n/translations";

interface CloudScenariosListProps {
  onLoad?: (inputs: Record<string, unknown>, label: string) => void;
  language?: Language;
  className?: string;
}

const LABELS = {
  vi: {
    title: "Kịch bản đã lưu (Cloud)",
    open: "Xem Cloud",
    close: "Ẩn",
    load: "Tải lại",
    remove: "Xóa",
    empty: "Chưa có kịch bản nào trên cloud",
    loading: "Đang tải...",
    error: "Lỗi kết nối cloud",
    refresh: "Làm mới",
  },
  en: {
    title: "Saved Scenarios (Cloud)",
    open: "Show Cloud",
    close: "Hide",
    load: "Load",
    remove: "Delete",
    empty: "No cloud scenarios yet",
    loading: "Loading...",
    error: "Cloud connection error",
    refresh: "Refresh",
  },
} as const;

export default function CloudScenariosList({
  onLoad,
  language = "vi",
  className = "",
}: CloudScenariosListProps) {
  const { cloudEnabled, records, loading, error, refresh, remove, loadAsScenario } =
    useCloudScenarios();
  const [open, setOpen] = useState(false);

  if (!cloudEnabled) return null;

  const t = LABELS[language];

  return (
    <div className={`rounded-md border border-slate-200 dark:border-slate-700 ${className}`.trim()}>
      <div className="flex items-center justify-between p-3">
        <span className="text-sm font-semibold">{t.title}</span>
        <div className="flex gap-2">
          {open && (
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              {t.refresh}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
          >
            {open ? t.close : t.open}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 p-3 dark:border-slate-700">
          {loading && <p className="text-sm text-slate-500">{t.loading}</p>}
          {error && !loading && (
            <p className="text-sm text-rose-600">{t.error}: {error}</p>
          )}
          {!loading && !error && records.length === 0 && (
            <p className="text-sm text-slate-500">{t.empty}</p>
          )}
          {!loading && records.length > 0 && (
            <ul className="space-y-2">
              {records.map((rec) => (
                <li
                  key={rec.id}
                  className="flex items-center justify-between rounded border border-slate-100 p-2 text-sm dark:border-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{rec.label}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(rec.updated_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {onLoad && (
                      <button
                        type="button"
                        onClick={() => {
                          const parsed = loadAsScenario<Record<string, unknown>>(rec);
                          if (parsed) onLoad(parsed, rec.label);
                        }}
                        className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {t.load}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void remove(rec.id)}
                      className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                    >
                      {t.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

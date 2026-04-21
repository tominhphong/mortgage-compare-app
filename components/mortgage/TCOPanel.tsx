"use client";

/**
 * TCOPanel — Total Cost of Ownership breakdown panel.
 * Hold period selector (5/10/30 years), stacked bar chart,
 * net equity callout, and "true" monthly cost over hold period.
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateTCO } from "@/lib/mortgage/tco";
import type { TCOInput } from "@/lib/mortgage/tco";
import type { MortgageInput } from "@/lib/mortgage/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(2)}M`;
  if (compact && Math.abs(n) >= 1_000)
    return `$${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------------
// Bar chart segments
// ---------------------------------------------------------------------------

interface BarSegment {
  label: string;
  labelVi: string;
  value: number;
  color: string;
  negative?: boolean;
}

function CostBarChart({ segments }: { segments: BarSegment[] }) {
  const positiveTotal = segments
    .filter((s) => !s.negative)
    .reduce((sum, s) => sum + s.value, 0);

  if (positiveTotal <= 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {/* Proportional bar — positives only */}
      <div
        className="flex h-7 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label="TCO cost breakdown"
      >
        {segments
          .filter((s) => !s.negative && s.value > 0)
          .map((seg) => (
            <div
              key={seg.label}
              className={`${seg.color} transition-all`}
              style={{ width: `${(seg.value / positiveTotal) * 100}%` }}
              title={`${seg.labelVi}: ${fmt(seg.value, true)}`}
            />
          ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <div
              className={`size-2.5 rounded-full shrink-0 ${seg.color}`}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground">
              {seg.labelVi}{" "}
              <span
                className={`font-medium ${seg.negative ? "text-green-600" : "text-foreground"}`}
              >
                {seg.negative ? "-" : ""}
                {fmt(seg.value, true)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat row
// ---------------------------------------------------------------------------

function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "green" | "blue";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-semibold tabular-nums ${
          highlight === "green"
            ? "text-green-600"
            : highlight === "blue"
              ? "text-blue-600"
              : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TCOPanelProps {
  mortgageInput: MortgageInput;
}

const HOLD_OPTIONS = [5, 10, 30] as const;
type HoldYear = (typeof HOLD_OPTIONS)[number];

export function TCOPanel({ mortgageInput }: TCOPanelProps) {
  const [holdYears, setHoldYears] = React.useState<HoldYear>(10);

  const tcoInput: TCOInput = {
    ...mortgageInput,
    holdYears,
  };

  const result = React.useMemo(() => calculateTCO(tcoInput), [
    mortgageInput,
    holdYears,
  ]);

  const segments: BarSegment[] = [
    {
      label: "mortgage",
      labelVi: "Trả nợ vay",
      value: result.totalMortgagePayments,
      color: "bg-blue-500",
    },
    {
      label: "maintenance",
      labelVi: "Bảo trì",
      value: result.totalMaintenance,
      color: "bg-orange-400",
    },
    {
      label: "utilities",
      labelVi: "Tiện ích",
      value: result.totalUtilities,
      color: "bg-yellow-400",
    },
    ...(result.totalPMI > 0
      ? [
          {
            label: "pmi",
            labelVi: "PMI",
            value: result.totalPMI,
            color: "bg-red-400",
          } as BarSegment,
        ]
      : []),
    {
      label: "taxSavings",
      labelVi: "Lợi thuế",
      value: result.taxBenefits,
      color: "bg-green-400",
      negative: true,
    },
  ];

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base">
            Tổng Chi Phí Sở Hữu (TCO)
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              / Total Cost of Ownership
            </span>
          </CardTitle>

          {/* Hold period selector */}
          <div className="flex gap-1">
            {HOLD_OPTIONS.map((y) => (
              <button
                key={y}
                onClick={() => setHoldYears(y)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  holdYears === y
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {y} năm
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-4">
        {/* True monthly cost callout */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/50 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Chi phí thực / True Monthly Cost
          </p>
          <p className="text-4xl font-bold tabular-nums text-foreground">
            {fmt(result.costPerMonth)}
          </p>
          <p className="text-xs text-muted-foreground">/tháng (sau lợi thuế & vốn)</p>
        </div>

        {/* Bar chart */}
        <CostBarChart segments={segments} />

        {/* Net equity callout */}
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-700 dark:text-green-400">
                Vốn chủ sở hữu ròng / Net Equity
              </p>
              <p className="text-xs text-green-600/80 dark:text-green-500">
                Sau bán nhà & phí môi giới (~6%)
              </p>
            </div>
            <p className="text-2xl font-bold tabular-nums text-green-700 dark:text-green-400">
              {fmt(result.netEquity, true)}
            </p>
          </div>
        </div>

        {/* Cost breakdown rows */}
        <div className="flex flex-col gap-2 rounded-lg bg-muted/30 px-4 py-3">
          <StatRow
            label="Tổng trả nợ / Mortgage Payments"
            value={fmt(result.totalMortgagePayments, true)}
          />
          <StatRow
            label="Bảo trì (đã điều chỉnh lạm phát)"
            value={fmt(result.totalMaintenance, true)}
          />
          <StatRow
            label="Tiện ích / Utilities"
            value={fmt(result.totalUtilities, true)}
          />
          {result.totalPMI > 0 && (
            <StatRow label="PMI" value={fmt(result.totalPMI, true)} />
          )}
          <div className="my-1 border-t" />
          <StatRow
            label="Tổng chi phí thô / Gross Cost"
            value={fmt(result.totalCost, true)}
          />
          <StatRow
            label="Lợi thuế / Tax Benefits"
            value={`-${fmt(result.taxBenefits, true)}`}
            highlight="green"
          />
          <StatRow
            label="Giá trị nhà cuối kỳ / Home Value"
            value={fmt(result.homeValueAtEnd, true)}
            highlight="blue"
          />
          <div className="my-1 border-t" />
          <StatRow
            label={`Chi phí ròng / Net Cost (${holdYears} năm)`}
            value={fmt(result.netCost, true)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

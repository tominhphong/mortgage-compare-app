"use client";

/**
 * RentVsBuyPanel — Rent vs Buy break-even analysis panel.
 * Inputs: current monthly rent, expected rent growth slider.
 * Outputs: break-even year, recommendation card, cumulative cost line chart (CSS).
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateRentVsBuy } from "@/lib/mortgage/rent-vs-buy";
import type { RentVsBuyInput } from "@/lib/mortgage/rent-vs-buy";
import { buildScenario } from "@/lib/mortgage/calculator";
import type { MortgageInput } from "@/lib/mortgage/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(1)}M`;
  if (compact && Math.abs(n) >= 1_000)
    return `$${Math.round(n / 1_000)}K`;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ---------------------------------------------------------------------------
// Mini line chart using CSS/SVG (no recharts dependency)
// ---------------------------------------------------------------------------

interface LineChartProps {
  buyData: number[];
  rentData: number[];
  breakEvenYear: number | null;
}

function MiniLineChart({ buyData, rentData, breakEvenYear }: LineChartProps) {
  const allValues = [...buyData, ...rentData].filter((v) => isFinite(v) && v > 0);
  if (allValues.length === 0) return null;

  const maxVal = Math.max(...allValues);
  const years = buyData.length;
  const WIDTH = 400;
  const HEIGHT = 120;
  const PAD = { top: 8, right: 12, bottom: 24, left: 44 };
  const chartW = WIDTH - PAD.left - PAD.right;
  const chartH = HEIGHT - PAD.top - PAD.bottom;

  const xScale = (i: number) => PAD.left + (i / Math.max(years - 1, 1)) * chartW;
  const yScale = (v: number) => PAD.top + chartH - (v / maxVal) * chartH;

  const toPath = (data: number[]) =>
    data
      .map((v, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(v).toFixed(1)}`)
      .join(" ");

  // Y-axis labels (3 ticks)
  const yTicks = [0, 0.5, 1].map((f) => ({
    v: maxVal * f,
    y: yScale(maxVal * f),
  }));

  // X-axis labels (every 5 years)
  const xLabels: { year: number; x: number }[] = [];
  for (let y = 5; y <= years; y += 5) {
    xLabels.push({ year: y, x: xScale(y - 1) });
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      aria-label="Rent vs Buy cumulative cost chart"
    >
      {/* Grid lines */}
      {yTicks.map(({ y }, i) => (
        <line
          key={i}
          x1={PAD.left}
          y1={y}
          x2={WIDTH - PAD.right}
          y2={y}
          stroke="currentColor"
          strokeOpacity={0.1}
          strokeWidth={1}
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.map(({ v, y }, i) => (
        <text
          key={i}
          x={PAD.left - 4}
          y={y + 4}
          textAnchor="end"
          fontSize={9}
          fill="currentColor"
          opacity={0.5}
        >
          {fmt(v, true)}
        </text>
      ))}

      {/* X-axis labels */}
      {xLabels.map(({ year, x }) => (
        <text
          key={year}
          x={x}
          y={HEIGHT - 4}
          textAnchor="middle"
          fontSize={9}
          fill="currentColor"
          opacity={0.5}
        >
          {year}yr
        </text>
      ))}

      {/* Break-even vertical line */}
      {breakEvenYear !== null && breakEvenYear <= years && (
        <line
          x1={xScale(breakEvenYear - 1)}
          y1={PAD.top}
          x2={xScale(breakEvenYear - 1)}
          y2={HEIGHT - PAD.bottom}
          stroke="#22c55e"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          opacity={0.7}
        />
      )}

      {/* Renting line (dashed orange) */}
      <path
        d={toPath(rentData)}
        fill="none"
        stroke="#f97316"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Buying line (solid blue) */}
      <path
        d={toPath(buyData)}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RentVsBuyPanelProps {
  mortgageInput: MortgageInput;
}

export function RentVsBuyPanel({ mortgageInput }: RentVsBuyPanelProps) {
  const [monthlyRent, setMonthlyRent] = React.useState(2200);
  const [rentGrowthPct, setRentGrowthPct] = React.useState(3);

  const result = React.useMemo(() => {
    const breakdown = buildScenario(mortgageInput);
    const rvbInput: RentVsBuyInput = {
      homePrice: mortgageInput.homePrice,
      downPayment: mortgageInput.downPayment,
      breakdown,
      currentMonthlyRent: monthlyRent,
      annualRentGrowth: rentGrowthPct / 100,
      holdYearsMax: 30,
    };
    return calculateRentVsBuy(rvbInput);
  }, [mortgageInput, monthlyRent, rentGrowthPct]);

  const recommendationConfig = {
    buy: {
      bg: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
      text: "text-green-700 dark:text-green-400",
      badge: "default" as const,
      label: "Nên Mua / BUY",
      icon: "🏠",
    },
    rent: {
      bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
      text: "text-red-700 dark:text-red-400",
      badge: "destructive" as const,
      label: "Nên Thuê / RENT",
      icon: "🏢",
    },
    neutral: {
      bg: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800",
      text: "text-yellow-700 dark:text-yellow-400",
      badge: "secondary" as const,
      label: "Trung Lập / NEUTRAL",
      icon: "⚖️",
    },
  };

  const rec = recommendationConfig[result.recommendation];

  return (
    <Card>
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-base">
          Thuê vs Mua / Rent vs Buy
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            Break-Even Analysis
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-4">
        {/* --- Inputs --- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Monthly rent input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tiền thuê hiện tại / Current Monthly Rent
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">$</span>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) =>
                  setMonthlyRent(Math.max(0, Number(e.target.value)))
                }
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                min={0}
                step={100}
              />
              <span className="text-xs text-muted-foreground">/tháng</span>
            </div>
          </div>

          {/* Rent growth slider */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tăng tiền thuê / Annual Rent Growth:{" "}
              <span className="text-foreground font-semibold">{rentGrowthPct}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={8}
              step={0.5}
              value={rentGrowthPct}
              onChange={(e) => setRentGrowthPct(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>4%</span>
              <span>8%</span>
            </div>
          </div>
        </div>

        {/* --- Recommendation card --- */}
        <div className={`rounded-xl border px-4 py-3 ${rec.bg}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">
                  {rec.icon}
                </span>
                <p className={`text-sm font-semibold ${rec.text}`}>
                  {rec.label}
                </p>
              </div>
              <p className={`mt-1 text-xs ${rec.text} opacity-80`}>
                {result.summary}
              </p>
            </div>
            <Badge variant={rec.badge} className="shrink-0">
              {result.breakEvenYear !== null
                ? `Hoà vốn năm ${result.breakEvenYear}`
                : "Không hoà vốn"}
            </Badge>
          </div>
        </div>

        {/* --- Chart --- */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-5 rounded-full bg-blue-500" />
              <span>Mua nhà / Buying</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="h-0.5 w-5 rounded-full bg-orange-500"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(90deg, #f97316 0 4px, transparent 4px 6px)",
                  height: "2px",
                  background: "none",
                  borderTop: "2px dashed #f97316",
                }}
              />
              <span>Thuê nhà / Renting</span>
            </div>
            {result.breakEvenYear !== null && (
              <div className="flex items-center gap-1.5">
                <div className="h-4 w-px bg-green-500" />
                <span className="text-green-600">Hoà vốn / Break-even</span>
              </div>
            )}
          </div>

          <MiniLineChart
            buyData={result.cumulativeNetOwningCost}
            rentData={result.cumulativeRentingCost}
            breakEvenYear={result.breakEvenYear}
          />
        </div>

        {/* --- Stats --- */}
        <div className="grid grid-cols-3 gap-2">
          <StatBox
            label="Hoà vốn / Break-Even"
            value={
              result.breakEvenYear !== null
                ? `Năm ${result.breakEvenYear}`
                : "N/A"
            }
            accent={result.breakEvenYear !== null ? "green" : "muted"}
          />
          <StatBox
            label="Chi phí mua (30 năm)"
            value={fmt(
              result.cumulativeNetOwningCost[
                result.cumulativeNetOwningCost.length - 1
              ] ?? 0,
              true
            )}
            accent="blue"
          />
          <StatBox
            label="Cơ hội đầu tư / Opp. Cost"
            value={fmt(result.opportunityCost, true)}
            accent="orange"
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// StatBox sub-component
// ---------------------------------------------------------------------------

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "green" | "blue" | "orange" | "muted";
}) {
  const colorClass =
    accent === "green"
      ? "text-green-600 dark:text-green-400"
      : accent === "blue"
        ? "text-blue-600 dark:text-blue-400"
        : accent === "orange"
          ? "text-orange-600 dark:text-orange-400"
          : "text-foreground";

  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 px-2 py-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">
        {label}
      </p>
      <p className={`text-sm font-bold tabular-nums ${colorClass}`}>{value}</p>
    </div>
  );
}
